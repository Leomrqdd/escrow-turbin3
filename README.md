# Escrow

Solana (Anchor) escrow program: a **maker** deposits token A and sets the amount of token B they accept in exchange; a **taker** can either complete the swap (**take**), or the **maker** can cancel and get their tokens back (**refund**).

## Instructions

- **make** — The maker creates the escrow (seed, deposit, receive) and deposits token A into the vault.
- **take** — The taker sends token B to the maker and receives token A from the vault; the escrow and vault are closed.
- **refund** — The maker withdraws token A from the vault and closes the escrow.

## Tests

Two scenarios are covered:

1. **make then take** — Full swap.
2. **make then refund** — Maker cancels.

![Test results](tests_escrow.png)

## Run tests

```bash
anchor test
```
