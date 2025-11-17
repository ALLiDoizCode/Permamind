---
name: ao-token
version: 1.0.0
author: Permamind Team
description: Build AO Standard Token implementations with balance management, transfers, minting, and ADP compliance
tags: ["ao", "token", "blockchain", "finance"]
dependencies:
  - name: ao
    version: 1.0.4
changelog: |
  ## Added (v1.0.0)
  - Initial token skill based on AOS token.lua blueprint
  - Token initialization with configurable parameters
  - Balance management and querying
  - Transfer functionality with notifications
  - Minting capabilities (owner-restricted)
  - ADP v1.0 compliance with Info handler
  - Big integer support with bint library
---

# AO Token Skill

## What is the AO Token Standard?

The **AO Token Standard** is a specification for implementing fungible tokens on the AO protocol. It provides a complete framework for:

- **Token Metadata**: Name, ticker, logo, and denomination
- **Balance Management**: Track balances across multiple accounts
- **Transfers**: Move tokens between accounts with validation
- **Minting**: Create new tokens (owner-restricted)
- **Supply Tracking**: Monitor total token supply
- **Notifications**: Send debit and credit notices on transfers
- **ADP Compliance**: Self-documenting capabilities

The standard implementation uses the `bint` library for 256-bit integer arithmetic, ensuring precise handling of large token quantities without overflow issues.

## When to Use This Skill

This skill activates when you need to:

- **Create a new token** - Build a fungible token on AO from scratch
- **Implement transfers** - Enable token movement between accounts
- **Manage balances** - Track and query account balances
- **Mint tokens** - Create new tokens with owner controls
- **Add token features** - Extend basic token functionality (burning, staking, etc.)
- **Understand token patterns** - Learn AO token implementation best practices
- **ADP compliance** - Make tokens discoverable and self-documenting

If you're asking about "AO tokens", "token transfers", "minting", or "fungible tokens", this skill provides the implementation patterns you need.

## Token Architecture

**Token Process Structure:**

```
┌─────────────────────────────────────────┐
│        Token Process (Actor)            │
├─────────────────────────────────────────┤
│  State:                                 │
│    • Name: "Points Coin"                │
│    • Ticker: "PNTS"                     │
│    • Denomination: 12                   │
│    • TotalSupply: "10000"               │
│    • Logo: "Arweave TX ID"              │
│    • Balances: {address: amount}        │
│                                         │
│  Handlers:                              │
│    • Info (metadata)                    │
│    • Balance (query)                    │
│    • Balances (all accounts)            │
│    • Transfer (move tokens)             │
│    • Mint (create tokens)               │
│    • Total-Supply (query supply)        │
└─────────────────────────────────────────┘
```

**Token Flow:**

```
Transfer Request
    ↓
Validate (recipient, quantity, balance)
    ↓
Update Balances (sender -quantity, recipient +quantity)
    ↓
Send Notifications (Debit-Notice, Credit-Notice)
    ↓
Update Base State (patch@1.0 device)
```

## Core Token Handlers

### Info Handler (ADP Compliance)

Returns token metadata and handler documentation.

```lua
Handlers.add("info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        ao.send({
            Target = msg.From,
            Data = json.encode({
                process = {
                    name = Name,
                    ticker = Ticker,
                    logo = Logo,
                    denomination = tostring(Denomination),
                    totalSupply = tostring(TotalSupply),
                    adpVersion = "1.0"
                },
                handlers = {
                    -- See full implementation below
                }
            })
        })
    end
)
```

### Balance Handler

Query balance for a specific account or the sender.

```lua
Handlers.add("balance",
    Handlers.utils.hasMatchingTag("Action", "Balance"),
    function(msg)
        local target = msg.Target or msg.Recipient or msg.From
        local balance = Balances[target] or "0"

        ao.send({
            Target = msg.From,
            Action = "Balance-Response",
            Balance = balance,
            Account = target,
            Ticker = Ticker
        })
    end
)
```

**Usage:**

```lua
-- Query your own balance
ao.send({
    Target = "token-process-id",
    Action = "Balance"
})

-- Query another account's balance
ao.send({
    Target = "token-process-id",
    Action = "Balance",
    Recipient = "account-address"
})
```

### Balances Handler

Returns all account balances as JSON.

```lua
Handlers.add("balances",
    Handlers.utils.hasMatchingTag("Action", "Balances"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "Balances-Response",
            Data = json.encode(Balances)
        })
    end
)
```

### Transfer Handler

Transfer tokens between accounts with validation and notifications.

```lua
Handlers.add("transfer",
    Handlers.utils.hasMatchingTag("Action", "Transfer"),
    function(msg)
        -- Validate inputs
        local recipient = msg.Recipient
        local quantity = bint(msg.Quantity)

        if not recipient then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Recipient is required"
            })
            return
        end

        if not quantity or quantity <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Quantity must be greater than 0"
            })
            return
        end

        -- Check sender balance
        local senderBalance = bint(Balances[msg.From] or "0")
        if senderBalance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Insufficient balance"
            })
            return
        end

        -- Update balances
        Balances[msg.From] = tostring(senderBalance - quantity)
        Balances[recipient] = tostring(bint(Balances[recipient] or "0") + quantity)

        -- Send notifications (unless Cast flag is set)
        if not msg.Cast then
            -- Debit notice to sender
            ao.send({
                Target = msg.From,
                Action = "Debit-Notice",
                Recipient = recipient,
                Quantity = tostring(quantity),
                Data = "Transfer successful"
            })

            -- Credit notice to recipient
            ao.send({
                Target = recipient,
                Action = "Credit-Notice",
                Sender = msg.From,
                Quantity = tostring(quantity)
            })
        end

        -- Update base state
        ao.send({
            Target = ao.id,
            Action = "patch@1.0",
            Data = json.encode({
                Balances = Balances
            })
        })
    end
)
```

**Usage:**

```lua
-- Transfer tokens
ao.send({
    Target = "token-process-id",
    Action = "Transfer",
    Recipient = "recipient-address",
    Quantity = "100"
})

-- Transfer without notifications (silent)
ao.send({
    Target = "token-process-id",
    Action = "Transfer",
    Recipient = "recipient-address",
    Quantity = "100",
    Cast = "true"
})
```

### Mint Handler

Create new tokens (restricted to process owner).

```lua
Handlers.add("mint",
    Handlers.utils.hasMatchingTag("Action", "Mint"),
    function(msg)
        -- Validate sender is process owner
        if msg.From ~= ao.id then
            ao.send({
                Target = msg.From,
                Action = "Mint-Error",
                Error = "Only process owner can mint"
            })
            return
        end

        -- Validate quantity
        local quantity = bint(msg.Quantity)
        if not quantity or quantity <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Mint-Error",
                Error = "Quantity must be greater than 0"
            })
            return
        end

        -- Mint tokens to owner
        local ownerBalance = bint(Balances[ao.id] or "0")
        Balances[ao.id] = tostring(ownerBalance + quantity)
        TotalSupply = tostring(bint(TotalSupply) + quantity)

        -- Send success response
        ao.send({
            Target = msg.From,
            Action = "Mint-Success",
            Quantity = tostring(quantity),
            TotalSupply = TotalSupply
        })

        -- Update base state
        ao.send({
            Target = ao.id,
            Action = "patch@1.0",
            Data = json.encode({
                Balances = Balances,
                TotalSupply = TotalSupply
            })
        })
    end
)
```

**Usage:**

```lua
-- Mint new tokens (owner only)
ao.send({
    Target = "token-process-id",
    Action = "Mint",
    Quantity = "1000"
})
```

### Total-Supply Handler

Query current token supply.

```lua
Handlers.add("total-supply",
    Handlers.utils.hasMatchingTag("Action", "Total-Supply"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "Total-Supply-Response",
            TotalSupply = TotalSupply,
            Ticker = Ticker
        })
    end
)
```

## Token Initialization

### State Variables

Initialize token state at the top of your process:

```lua
-- Token metadata
Name = Name or "Points Coin"
Ticker = Ticker or "PNTS"
Logo = Logo or "Sie_26dvgyok0PZD_-iQAFOhOd5YxDTkczOLoqTTL_A"
Denomination = Denomination or 12
TotalSupply = TotalSupply or "10000"

-- Balances table
Balances = Balances or {}

-- Initialize owner balance
if not Balances[ao.id] then
    Balances[ao.id] = TotalSupply
end
```

### bint Library

The token implementation requires the `bint` library for 256-bit integer arithmetic:

```lua
local bint = require('.bint')(256)

-- bint supports large numbers without overflow
local largeNumber = bint("99999999999999999999")
local result = largeNumber + bint("1")

-- Convert back to string for storage
local strValue = tostring(result)
```

**Why bint?**

- Lua numbers are 64-bit floats (lose precision above ~2^53)
- Tokens often require precise large-number arithmetic
- bint provides 256-bit integer operations
- Compatible with Ethereum and other blockchain standards

## Complete Token Implementation

### Full Token Process

```lua
-- Load bint library for 256-bit integers
local bint = require('.bint')(256)

-- Initialize token state
Name = Name or "Points Coin"
Ticker = Ticker or "PNTS"
Logo = Logo or "Sie_26dvgyok0PZD_-iQAFOhOd5YxDTkczOLoqTTL_A"
Denomination = Denomination or 12
TotalSupply = TotalSupply or "10000"
Balances = Balances or {}

-- Set initial owner balance
if not Balances[ao.id] then
    Balances[ao.id] = TotalSupply
end

-- Info handler (ADP v1.0 compliance)
Handlers.add("info",
    Handlers.utils.hasMatchingTag("Action", "Info"),
    function(msg)
        ao.send({
            Target = msg.From,
            Data = json.encode({
                process = {
                    name = Name,
                    ticker = Ticker,
                    logo = Logo,
                    denomination = tostring(Denomination),
                    totalSupply = TotalSupply,
                    adpVersion = "1.0"
                },
                handlers = {
                    {
                        name = "balance",
                        action = "Balance",
                        type = "read",
                        description = "Query account balance",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Balance"}
                            },
                            optional = {
                                {name = "Target", type = "string", description = "Account to query (defaults to sender)"},
                                {name = "Recipient", type = "string", description = "Alternative to Target"}
                            }
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "Balance-Response"},
                                {name = "Balance", type = "string"},
                                {name = "Account", type = "string"},
                                {name = "Ticker", type = "string"}
                            }
                        }
                    },
                    {
                        name = "balances",
                        action = "Balances",
                        type = "read",
                        description = "Get all account balances",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Balances"}
                            },
                            optional = {}
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "Balances-Response"}
                            },
                            data = "JSON object mapping addresses to balances"
                        }
                    },
                    {
                        name = "transfer",
                        action = "Transfer",
                        type = "write",
                        description = "Transfer tokens to another account",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Transfer"},
                                {name = "Recipient", type = "string", description = "Recipient address"},
                                {name = "Quantity", type = "string", description = "Amount to transfer (as string)"}
                            },
                            optional = {
                                {name = "Cast", type = "string", description = "Set to 'true' to skip notifications"}
                            }
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "Debit-Notice"},
                                {name = "Recipient", type = "string"},
                                {name = "Quantity", type = "string"}
                            }
                        }
                    },
                    {
                        name = "mint",
                        action = "Mint",
                        type = "write",
                        description = "Create new tokens (owner only)",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Mint"},
                                {name = "Quantity", type = "string", description = "Amount to mint (as string)"}
                            },
                            optional = {}
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "Mint-Success"},
                                {name = "Quantity", type = "string"},
                                {name = "TotalSupply", type = "string"}
                            }
                        }
                    },
                    {
                        name = "total-supply",
                        action = "Total-Supply",
                        type = "read",
                        description = "Query total token supply",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Total-Supply"}
                            },
                            optional = {}
                        },
                        response = {
                            tags = {
                                {name = "Action", type = "string", value = "Total-Supply-Response"},
                                {name = "TotalSupply", type = "string"},
                                {name = "Ticker", type = "string"}
                            }
                        }
                    },
                    {
                        name = "info",
                        action = "Info",
                        type = "read",
                        description = "Get token metadata and handler information (ADP v1.0)",
                        tags = {
                            required = {
                                {name = "Action", type = "string", value = "Info"}
                            },
                            optional = {}
                        },
                        response = {
                            data = "JSON object with token metadata and handlers schema"
                        }
                    }
                }
            })
        })
    end
)

-- Balance handler
Handlers.add("balance",
    Handlers.utils.hasMatchingTag("Action", "Balance"),
    function(msg)
        local target = msg.Target or msg.Recipient or msg.From
        local balance = Balances[target] or "0"

        ao.send({
            Target = msg.From,
            Action = "Balance-Response",
            Balance = balance,
            Account = target,
            Ticker = Ticker
        })
    end
)

-- Balances handler
Handlers.add("balances",
    Handlers.utils.hasMatchingTag("Action", "Balances"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "Balances-Response",
            Data = json.encode(Balances)
        })
    end
)

-- Transfer handler
Handlers.add("transfer",
    Handlers.utils.hasMatchingTag("Action", "Transfer"),
    function(msg)
        local recipient = msg.Recipient
        local quantity = bint(msg.Quantity)

        if not recipient then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Recipient is required"
            })
            return
        end

        if not quantity or quantity <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Quantity must be greater than 0"
            })
            return
        end

        local senderBalance = bint(Balances[msg.From] or "0")
        if senderBalance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Transfer-Error",
                Error = "Insufficient balance"
            })
            return
        end

        Balances[msg.From] = tostring(senderBalance - quantity)
        Balances[recipient] = tostring(bint(Balances[recipient] or "0") + quantity)

        if not msg.Cast then
            local debitTags = {
                Target = msg.From,
                Action = "Debit-Notice",
                Recipient = recipient,
                Quantity = tostring(quantity),
                Data = "Transfer successful"
            }

            -- Forward X- prefixed tags
            for tagName, tagValue in pairs(msg) do
                if string.sub(tagName, 1, 2) == "X-" then
                    debitTags[tagName] = tagValue
                end
            end

            ao.send(debitTags)

            local creditTags = {
                Target = recipient,
                Action = "Credit-Notice",
                Sender = msg.From,
                Quantity = tostring(quantity)
            }

            -- Forward X- prefixed tags
            for tagName, tagValue in pairs(msg) do
                if string.sub(tagName, 1, 2) == "X-" then
                    creditTags[tagName] = tagValue
                end
            end

            ao.send(creditTags)
        end

        ao.send({
            Target = ao.id,
            Action = "patch@1.0",
            Data = json.encode({
                Balances = Balances
            })
        })
    end
)

-- Mint handler
Handlers.add("mint",
    Handlers.utils.hasMatchingTag("Action", "Mint"),
    function(msg)
        if msg.From ~= ao.id then
            ao.send({
                Target = msg.From,
                Action = "Mint-Error",
                Error = "Only process owner can mint"
            })
            return
        end

        local quantity = bint(msg.Quantity)
        if not quantity or quantity <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Mint-Error",
                Error = "Quantity must be greater than 0"
            })
            return
        end

        local ownerBalance = bint(Balances[ao.id] or "0")
        Balances[ao.id] = tostring(ownerBalance + quantity)
        TotalSupply = tostring(bint(TotalSupply) + quantity)

        ao.send({
            Target = msg.From,
            Action = "Mint-Success",
            Quantity = tostring(quantity),
            TotalSupply = TotalSupply
        })

        ao.send({
            Target = ao.id,
            Action = "patch@1.0",
            Data = json.encode({
                Balances = Balances,
                TotalSupply = TotalSupply
            })
        })
    end
)

-- Total supply handler
Handlers.add("total-supply",
    Handlers.utils.hasMatchingTag("Action", "Total-Supply"),
    function(msg)
        ao.send({
            Target = msg.From,
            Action = "Total-Supply-Response",
            TotalSupply = TotalSupply,
            Ticker = Ticker
        })
    end
)
```

## Advanced Token Features

### Custom Transfer Tags

The transfer handler forwards any tags prefixed with `X-` to notification messages:

```lua
-- Transfer with custom metadata
ao.send({
    Target = "token-process-id",
    Action = "Transfer",
    Recipient = "recipient-address",
    Quantity = "100",
    ["X-Memo"] = "Payment for services",
    ["X-Invoice"] = "INV-12345"
})

-- Recipient receives Credit-Notice with:
-- X-Memo: "Payment for services"
-- X-Invoice: "INV-12345"
```

### Burn Functionality (Extension)

Add token burning capability:

```lua
Handlers.add("burn",
    Handlers.utils.hasMatchingTag("Action", "Burn"),
    function(msg)
        local quantity = bint(msg.Quantity)

        if not quantity or quantity <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Burn-Error",
                Error = "Quantity must be greater than 0"
            })
            return
        end

        local senderBalance = bint(Balances[msg.From] or "0")
        if senderBalance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Burn-Error",
                Error = "Insufficient balance"
            })
            return
        end

        -- Reduce sender balance and total supply
        Balances[msg.From] = tostring(senderBalance - quantity)
        TotalSupply = tostring(bint(TotalSupply) - quantity)

        ao.send({
            Target = msg.From,
            Action = "Burn-Success",
            Quantity = tostring(quantity),
            TotalSupply = TotalSupply
        })

        ao.send({
            Target = ao.id,
            Action = "patch@1.0",
            Data = json.encode({
                Balances = Balances,
                TotalSupply = TotalSupply
            })
        })
    end
)
```

### Allowances (Delegated Transfers)

Implement ERC-20 style allowances:

```lua
-- State
Allowances = Allowances or {}  -- {owner: {spender: amount}}

-- Approve handler
Handlers.add("approve",
    Handlers.utils.hasMatchingTag("Action", "Approve"),
    function(msg)
        local spender = msg.Spender
        local amount = msg.Amount

        if not spender or not amount then
            ao.send({
                Target = msg.From,
                Action = "Approve-Error",
                Error = "Spender and Amount required"
            })
            return
        end

        Allowances[msg.From] = Allowances[msg.From] or {}
        Allowances[msg.From][spender] = amount

        ao.send({
            Target = msg.From,
            Action = "Approve-Success",
            Spender = spender,
            Amount = amount
        })
    end
)

-- Transfer-From handler
Handlers.add("transfer-from",
    Handlers.utils.hasMatchingTag("Action", "Transfer-From"),
    function(msg)
        local owner = msg.Owner
        local recipient = msg.Recipient
        local quantity = bint(msg.Quantity)

        -- Validate allowance
        local allowance = bint(Allowances[owner] and Allowances[owner][msg.From] or "0")
        if allowance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Transfer-From-Error",
                Error = "Insufficient allowance"
            })
            return
        end

        -- Check owner balance
        local ownerBalance = bint(Balances[owner] or "0")
        if ownerBalance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Transfer-From-Error",
                Error = "Insufficient balance"
            })
            return
        end

        -- Execute transfer
        Balances[owner] = tostring(ownerBalance - quantity)
        Balances[recipient] = tostring(bint(Balances[recipient] or "0") + quantity)
        Allowances[owner][msg.From] = tostring(allowance - quantity)

        ao.send({
            Target = msg.From,
            Action = "Transfer-From-Success",
            Owner = owner,
            Recipient = recipient,
            Quantity = tostring(quantity)
        })
    end
)
```

## Testing Token Processes

### Local Testing with aolite

```lua
local aolite = require('aolite')

-- Load token code
local tokenCode = io.open("token.lua"):read("*all")
local tokenId = aolite.spawnProcess(tokenCode)

-- Test balance query
aolite.send("user1", tokenId, {
    Action = "Balance"
})
aolite.runScheduler()

-- Test transfer
aolite.send(tokenId, tokenId, {
    Action = "Transfer",
    Recipient = "user2",
    Quantity = "500"
})
aolite.runScheduler()

-- Verify balances
local msgs = aolite.getAllMsgs(tokenId)
for _, msg in ipairs(msgs) do
    if msg.Action == "Balance-Response" then
        print("Balance:", msg.Balance)
    end
end
```

### Integration Testing

```javascript
// Using aoconnect
import { connect } from '@permaweb/aoconnect';

const ao = connect();

// Query balance
const result = await ao.dryrun({
  process: tokenProcessId,
  tags: [{ name: 'Action', value: 'Balance' }]
});

console.log('Balance:', result.Messages[0].Tags.Balance);

// Transfer tokens
await ao.message({
  process: tokenProcessId,
  tags: [
    { name: 'Action', value: 'Transfer' },
    { name: 'Recipient', value: recipientAddress },
    { name: 'Quantity', value: '100' }
  ]
});
```

## Best Practices

**Token Design:**
- Use descriptive token names and tickers
- Set appropriate denomination (decimals)
- Initialize with reasonable supply
- Document token economics

**Security:**
- Validate all inputs before processing
- Check balances before transfers
- Restrict minting to authorized addresses
- Use bint for all arithmetic operations
- Test overflow/underflow scenarios

**State Management:**
- Store balances as strings (bint compatibility)
- Update base state after modifications
- Maintain supply consistency
- Initialize state with `or {}` pattern

**Notifications:**
- Send Debit-Notice to sender
- Send Credit-Notice to recipient
- Support Cast flag for silent transfers
- Forward custom X- prefixed tags

**ADP Compliance:**
- Implement Info handler
- Document all handlers thoroughly
- Specify read vs write operations
- List all tags (required and optional)
- Keep documentation synchronized

**Testing:**
- Test with large numbers (>2^53)
- Verify balance updates
- Test insufficient balance scenarios
- Validate owner-only operations
- Test notification delivery

## Common Patterns

### Tiered Token System

```lua
-- Token tiers with different permissions
Tiers = Tiers or {
    basic = {minBalance = "0"},
    premium = {minBalance = "1000"},
    elite = {minBalance = "10000"}
}

function getUserTier(address)
    local balance = bint(Balances[address] or "0")
    if balance >= bint(Tiers.elite.minBalance) then
        return "elite"
    elseif balance >= bint(Tiers.premium.minBalance) then
        return "premium"
    else
        return "basic"
    end
end
```

### Token Vesting

```lua
-- Vesting schedule
VestingSchedules = VestingSchedules or {}  -- {address: {amount, startTime, duration}}

Handlers.add("claim-vested",
    Handlers.utils.hasMatchingTag("Action", "Claim-Vested"),
    function(msg)
        local schedule = VestingSchedules[msg.From]
        if not schedule then
            ao.send({
                Target = msg.From,
                Action = "Claim-Error",
                Error = "No vesting schedule"
            })
            return
        end

        local elapsed = msg.Timestamp - schedule.startTime
        local vestedAmount = bint(schedule.amount) * bint(elapsed) / bint(schedule.duration)
        local claimedAmount = bint(schedule.claimed or "0")
        local claimable = vestedAmount - claimedAmount

        if claimable <= bint(0) then
            ao.send({
                Target = msg.From,
                Action = "Claim-Error",
                Error = "No tokens available"
            })
            return
        end

        -- Transfer vested tokens
        Balances[msg.From] = tostring(bint(Balances[msg.From] or "0") + claimable)
        schedule.claimed = tostring(claimedAmount + claimable)

        ao.send({
            Target = msg.From,
            Action = "Claim-Success",
            Quantity = tostring(claimable)
        })
    end
)
```

### Staking

```lua
-- Staking state
Stakes = Stakes or {}  -- {address: {amount, timestamp}}

Handlers.add("stake",
    Handlers.utils.hasMatchingTag("Action", "Stake"),
    function(msg)
        local quantity = bint(msg.Quantity)
        local balance = bint(Balances[msg.From] or "0")

        if balance < quantity then
            ao.send({
                Target = msg.From,
                Action = "Stake-Error",
                Error = "Insufficient balance"
            })
            return
        end

        -- Move tokens to staking
        Balances[msg.From] = tostring(balance - quantity)
        Stakes[msg.From] = {
            amount = tostring(quantity),
            timestamp = msg.Timestamp
        }

        ao.send({
            Target = msg.From,
            Action = "Stake-Success",
            Quantity = tostring(quantity)
        })
    end
)
```

## Resources

**AO Token Specification:**
- Blueprint: https://github.com/permaweb/aos/blob/main/blueprints/token.lua
- Standards: https://hackmd.io/BHDsFUVLQSuVUXVJoaGSEQ

**Dependencies:**
- **ao skill**: Core AO protocol patterns and best practices
- **bint library**: 256-bit integer arithmetic for large numbers
- **aoconnect**: JavaScript SDK for token interaction

**Related Tools:**
- aolite: Local token testing and development
- AO Explorer: View token state and transactions
- aos CLI: Interactive token management

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**ADP Compliance**: v1.0
**Dependencies**: ao@1.0.4
