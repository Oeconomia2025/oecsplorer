# Oeconomia Protocol

The governance and coordination layer of the ecosystem. Stake OEC to become a Guardian, create proposals, vote on governance decisions, and earn achievement rewards.

## Contracts

| Contract            | Address                                      |
| ------------------- | -------------------------------------------- |
| OEC Token           | `0x00904218319a045a96d776ec6a970f54741208e6` |
| Guardian Staking    | `0xd12664c1f09fa1561b5f952259d1eb5555af3265` |
| Faucet              | `0x29c900b48079634e5b1e19508fa347340ee786bb` |
| Achievement Rewards | `0xbb0805254d328d1a542efb197b3a922c3fd97063` |

## Decoded Actions

| Function             | Decoded Label           |
| -------------------- | ----------------------- |
| `stake()`            | Staked OEC              |
| `unstake()`          | Unstaked OEC            |
| `getReward()`        | Claimed Staking Rewards |
| `withdraw()`         | Withdrew Stake          |
| `earlyWithdraw()`    | Early Withdrawal        |
| `vote()`             | Governance Vote         |
| `createProposal()`   | Created Proposal        |
| `executeProposal()`  | Executed Proposal       |

## Decoded Events

| Event             | Description                        |
| ----------------- | ---------------------------------- |
| `Staked`          | OEC tokens staked in Guardian pool |
| `Unstaked`        | OEC tokens unstaked                |
| `GuardianStaked`  | Guardian-tier stake registered     |
| `VoteCast`        | Vote cast on a governance proposal |
| `ProposalCreated` | New governance proposal created    |

## Guardian Staking

The MultiPoolStakingAPR contract supports multiple staking pools with different lock periods and reward rates. Guardians are users who stake above a minimum threshold, granting them governance voting rights and enhanced rewards.
