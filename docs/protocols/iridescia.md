# Iridescia Protocol

Developer infrastructure for the ecosystem — a contract factory, template registry, and security modules for safe contract deployment.

## Decoded Actions

| Function             | Decoded Label        |
| -------------------- | -------------------- |
| `deployContract()`   | Deployed Contract    |
| `useTemplate()`      | Used Template        |
| `registerTemplate()` | Registered Template  |
| `verifyContract()`   | Verified Contract    |

## Decoded Events

| Event               | Description                            |
| ------------------- | -------------------------------------- |
| `ContractDeployed`  | New contract deployed via factory      |
| `TemplateUsed`      | Existing template instantiated         |
| `TemplateRegistered`| New template added to registry         |

## Components

### Contract Factory

A permissionless factory that deploys pre-audited contract templates. Users select a template, configure parameters, and deploy — no Solidity knowledge required.

### Template Registry

A curated library of smart contract templates covering common patterns: ERC-20 tokens, vesting schedules, multisigs, staking pools, and more. Templates are reviewed and versioned.

### Security Module

Automated security checks run during deployment: reentrancy guards, access control verification, and known vulnerability pattern detection.
