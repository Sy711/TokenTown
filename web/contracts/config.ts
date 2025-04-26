interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x6744a55db0bfa05905d670981fc8490fe06a7d4263d45e5867f7f95727b2e00d",
        Vault:"0x4f27ae683637358ec5b2b70456572f1b7d243fd46efbe0f54d8e455456fbfe46",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}