interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x9bd642e6fdfbd1c039a8507923cb7a4727e12fc9294eef40ff516e92da718c08",
        Vault:"0xc125a30782a348a0fddad4444ff88b8d650b90fef3713339f106115b135d2436",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}