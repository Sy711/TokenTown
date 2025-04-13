module card::card;
use std::debug::print;
use sui::bag::{Self, Bag};
use sui::balance::{Self, Balance, zero};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::vec_map::{Self, VecMap};

const MAX_PLAYERS: u64 = 2; // 每局游戏最大玩家数量
const ENTRY_FEE: u64 = 500_000_000; // 费yong（0.5 SUI）
const FEE: u64 = 200_000_000; // 费yong（0.2 SUI）

const ECoinBalanceNotEnough: u64 = 1; // 余额不足
const ERoomNotExist: u64 = 2; // 房间不存在
const EALREADY_JOINED: u64 = 3; // 玩家已加入此房间
const EALREADY_NOT_JOINED: u64 = 4; // 玩家已加入此房间

public struct Room has drop, store {
    rank: u64,
    players: vector<address>,
    status: u8, // 0=等待中 1=进行中 2=已结束
    winner: address,
    loser:address,
    winner_has_claim:bool,
    loser_has_claim:bool,

}
/// 全局大厅池（自动管理）
public struct RoomPool has key {
    id: UID,
    rank_index: u64,
    open_lobbies: VecMap<u64, Room>,
    entry_fees: Bag,
}
public struct CreatedRoomEvent has copy, drop {
    rank: u64,
    start_game_time: u64,
}
public struct StartGameEvent has copy, drop {
    rank: u64,
    players: vector<address>,
    start_game_time: u64,
}
public struct DealCardEvent has copy,drop{
    rank:u64,
    amount:u64
}

public struct SubmitEvent has copy,drop{
 rank:u64,
 winner:address,
 loser:address,
}

public struct ClaimEvent has copy,drop{
 rank:u64,
 user:address,
 amount:u64,

}
entry fun new(ctx: &mut TxContext) {
    let pool = RoomPool {
        id: object::new(ctx),
        rank_index: 0,
        open_lobbies: vec_map::empty(),
        entry_fees: bag::new(ctx),
    };
    transfer::share_object(pool);
}
// ========== 统一入口方法 ==========

public entry fun join_or_create(
    pool: &mut RoomPool,
    wallet: &mut Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) { 
    let rank = find_available_lobby(pool); 
    if (rank!=0) {
        join_existing_room(pool, rank, wallet, clock, ctx);
    } else {
        create_room(pool, wallet, clock, ctx);
    } }
    // --------- 内部方法 ---------
fun find_available_lobby(pool: &mut RoomPool): u64 {
    while (!vec_map::is_empty(&pool.open_lobbies)) {
        let (rank, room) = vec_map::pop(&mut pool.open_lobbies);
        if (room.status == 0 && vector::length(&room.players) < 4) {
            vec_map::insert(&mut pool.open_lobbies, rank, room);
            return rank
        };
    };
    0
}
public entry fun create_room(
    pool: &mut RoomPool,
    wallet: &mut Coin<SUI>, // 4个玩家的入场费Coin
    clock: &Clock,
    ctx: &mut TxContext,
) :u64{
    assert!(wallet.value() >= ENTRY_FEE, ECoinBalanceNotEnough);
    let current_time = clock::timestamp_ms(clock);
    let sender = tx_context::sender(ctx);
    pool.rank_index = pool.rank_index+1;
    let rank = pool.rank_index;
    let room = Room {
        rank: rank,
        players: vector::empty(),
        status: 0,
        winner: @0x0,
        loser:@0x0,
        winner_has_claim:false,
        loser_has_claim:false,
    };

    let excess_amount = coin::value(wallet) - ENTRY_FEE;
    if (excess_amount > 0) {
        let excess_coin = coin::split(wallet, excess_amount, ctx);
        transfer::public_transfer(excess_coin, sender);
    };
    let split_balance = balance::split(coin::balance_mut(wallet), ENTRY_FEE);
    bag::add(&mut pool.entry_fees, rank, split_balance);
    vec_map::insert(&mut pool.open_lobbies, rank, room);
    let room_mut = vec_map::get_mut(&mut pool.open_lobbies, &rank);
    vector::push_back(&mut room_mut.players, sender);
    event::emit(CreatedRoomEvent { rank, start_game_time: current_time });
    rank
}

public fun join_existing_room(
    pool: &mut RoomPool,
    rank: u64,
    wallet: &mut Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
):u64 {
    assert_round_not_found(pool, rank);
    let sender = tx_context::sender(ctx);
    let room = vec_map::get_mut(&mut pool.open_lobbies, &rank);
    assert!(!vector::contains(&room.players, &sender), EALREADY_JOINED);
    assert!(wallet.value() >= ENTRY_FEE, ECoinBalanceNotEnough);
    assert!(room.status == 0, EALREADY_JOINED);
    let excess_amount = coin::value(wallet) - ENTRY_FEE;
    if (excess_amount > 0) {
        let excess_coin = coin::split(wallet, excess_amount, ctx);
        transfer::public_transfer(excess_coin, sender);
    };
    let split_balance = balance::split(coin::balance_mut(wallet), ENTRY_FEE);
    let pool_balance = bag::borrow_mut<u64, Balance<SUI>>(&mut pool.entry_fees, rank);
    pool_balance.join(split_balance);
    vector::push_back(&mut room.players, sender);
    // 更新状态
    if (vector::length(&room.players) == MAX_PLAYERS) {
        room.status = 1;
        let current_time = clock::timestamp_ms(clock);

        event::emit(StartGameEvent { rank, players: room.players, start_game_time: current_time });
    };
    rank
}

//发牌
public fun deal_card(
    pool: &mut RoomPool,
    wallet: &mut Coin<SUI>,
    rank:u64,
    ctx: &mut TxContext,
):bool{
        if(wallet.value() <FEE){
            return false
        } ;
            let sender = tx_context::sender(ctx);
            let room = vec_map::get_mut(&mut pool.open_lobbies, &rank);
        assert!(vector::contains(&room.players, &sender), EALREADY_NOT_JOINED);

    let excess_amount = coin::value(wallet) - FEE;
    if (excess_amount > 0) {
        let excess_coin = coin::split(wallet, excess_amount, ctx);
        transfer::public_transfer(excess_coin, sender);
    };
    let split_balance = balance::split(coin::balance_mut(wallet), FEE);
    let pool_balance = bag::borrow_mut<u64, Balance<SUI>>(&mut pool.entry_fees, rank);
    pool_balance.join(split_balance);
let amount =pool_balance.value();
event::emit(DealCardEvent{
rank,amount
});
true
}

public fun submit(
    pool: &mut RoomPool,
    wallet: &mut Coin<SUI>,
    rank:u64,
    player1: address,
    player2: address,
    count1: u64,
    count2: u64,
    ctx: &mut TxContext,
):address{
        assert!(wallet.value() >= FEE*2, ECoinBalanceNotEnough);
 let sender = tx_context::sender(ctx);
    let room = vec_map::get_mut(&mut pool.open_lobbies, &rank);
            assert!(vector::contains(&room.players, &sender), EALREADY_NOT_JOINED);
    let excess_amount = coin::value(wallet) - FEE*2;
    if (excess_amount > 0) {
        let excess_coin = coin::split(wallet, excess_amount, ctx);
        transfer::public_transfer(excess_coin, sender);
    };
    let split_balance = balance::split(coin::balance_mut(wallet), FEE);
    let pool_balance = bag::borrow_mut<u64, Balance<SUI>>(&mut pool.entry_fees, rank);
    pool_balance.join(split_balance);
    
    if (count1>count2){
        room.winner=player1;
        room.loser=player2;
    }else if(count1 < count2){
       room.winner=player2;
       room.loser=player1;
    }else{
        return room.winner
    };
    room.status=2;
    event::emit(SubmitEvent{rank,winner: room.winner,loser:room.loser});
   room.winner
}

public fun claim(
    pool: &mut RoomPool,
    rank:u64,
    ctx: &mut TxContext,
){
     let sender = tx_context::sender(ctx);
    let room = vec_map::get_mut(&mut pool.open_lobbies, &rank);
    assert!(vector::contains(&room.players, &sender), EALREADY_NOT_JOINED);
    let pool_balance = bag::borrow_mut<u64, Balance<SUI>>(&mut pool.entry_fees, rank);
        let win_amount=pool_balance.value()-FEE;

if (sender ==room.winner && !room.winner_has_claim ){
        let win_coin =coin::take<SUI>(pool_balance,win_amount,ctx);
        room.winner_has_claim=true;
        transfer::public_transfer(win_coin, sender);
        event::emit(ClaimEvent {
    rank,
    user:sender,
    amount:win_amount,
})

}else if(sender ==room.loser && !room.loser_has_claim){
        let loser_coin =coin::take<SUI>(pool_balance,FEE,ctx);
                room.loser_has_claim=true;
            transfer::public_transfer(loser_coin, sender);
             event::emit(ClaimEvent {
    rank,
    user:sender,
    amount:FEE,
})
}

}



public fun assert_round_not_found(pool: &RoomPool, round: u64) {
    assert!(pool.open_lobbies.contains(&round), ERoomNotExist);
}

#[test_only]
public fun assert_join_room(pool: &RoomPool, round: u64) :u64 {
    let room = pool.open_lobbies.get(&round);
room.players.length()
}
#[test_only]
public fun assert_room_status(pool: &RoomPool, round: u64) :u8 {
    let room = pool.open_lobbies.get(&round);
room.status
}
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    new(ctx);
}