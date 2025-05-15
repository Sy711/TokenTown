interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0xaaa6f50dee638bb6056f137fe2336f1dc03b0fc5a38f2ddce014b72bfaea89d7",
        Vault:"0xecc00b51af1cc0da48d54488428502bf80a33df18182352fb4e0d64617448e89",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}