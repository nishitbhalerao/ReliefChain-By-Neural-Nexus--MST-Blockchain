/**
 * On-chain role hashes — keccak256 of the role name string, matching ReliefChain.sol.
 * Generated with: ethers.keccak256(ethers.toUtf8Bytes("ROLE_NAME"))
 */
export const ROLE_HASHES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  ORGANIZATION_ROLE:  "0xe0ae735793555d3fe7bb9c3f6f29e053c01c45cee237096b99b73ac619531dfb" as `0x${string}`,
  APPROVER_ROLE:      "0x408a36151f841709116a4e8aca4e0202874f7f54687dcb863b1ea4672dc9d8cf" as `0x${string}`,
  RECORDER_ROLE:      "0xf996da754c790e95d5c7ca3330cfcad529487fe9d1d8edb7afc65076fdf9adb4" as `0x${string}`,
} as const;
