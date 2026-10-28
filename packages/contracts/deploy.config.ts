import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployAll(hre: HardhatRuntimeEnvironment) {
  const ReliefChain = await hre.ethers.getContractFactory("ReliefChain");
  const reliefChain = await ReliefChain.deploy();
  await reliefChain.waitForDeployment();

  return {
    ReliefChain: {
      address: await reliefChain.getAddress(),
      constructorArguments: [] as unknown[],
    },
  };
}
