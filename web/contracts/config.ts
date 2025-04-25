interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x785d87118c1bd56efc2db0118e5e1d244490e61ae37460f2f54b0e3b845fe155",
        Vault:"0xb9560423b34774ff50d09faa337aeb05b8e45c7036f8b9f71d1f08d879138d46",
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}