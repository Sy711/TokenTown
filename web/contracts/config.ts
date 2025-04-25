interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0xcf18bfee92ced7d74cea685a5ba3d6ec98f92b0aae28088f5bc0a1a709ae72be",
        Vault:"0x36f2d1484e51dc558fad55ca28424724889db833538915e0dd25324a90b96df0",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}