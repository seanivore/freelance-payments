# New Job JSON File Generator 

## Purpose

Create a custom command that generates a new job JSON file with a unique identifier and all required IDs/URLs filled in.

### Method

+ Method I have saved in my cheat sheet notes for creating custom command scripts 

  1. Create script file named how you run it: `touch ~/bin/job`
  2. Open that file in your editor: `nano ~/bin/job`
  3. Paste the Script in the editor file: `[it should have #!/bin/bash at the top]`
  4. Make the Script Executable: `chmod +x ~/bin/job`
  5. Ensure `~/bin` is in PATH (e.g. in `~/.zshrc`)
  6. Now run the script in the terminal: `job`

+ Yes, if `~/bin` is in PATH and the file is executable, you run `job` with no `.sh`.

### Flow of Execution 

1. User runs `job` in the terminal
2. The script uses the `uid` custom command to generate a unique identifier
3. The script copies the template JSON file `assets/docs/uid-xxx-xxx.json`
4. The script places the new file in `assets/docs/uid-xxx-xxx.json` (staging area)
5. That same UID is placed in the new JSON at:
  - `product.id`
  - `price1.product.products[0]`
  - `price2.product.products[0]`
  - `coupon.applies_to.products[0]`
6. Use the UID to replace `[uid-xxx-xxx]` in:
  - `checkout_session_1.return_url`
  - `checkout_session_2.return_url`
7. Replace `uid` → `cou` and set:
  - `coupon.id`
  - `checkout_session_1.discounts[0].coupon`
8. Replace `uid` → `cus` and set:
  - `customer.id`

### Flags to Consider

- `-n` or `--count` with a number to create multiple jobs (default is 1)
- `-nd` or `--no-discount` to create a new job JSON file with no `coupon.id` and no `checkout_session_1.discounts[0].coupon`
- `-p` with a value immediately following, or `--project` with a value immediately following, to create a new job JSON file with the first value on the JSON `project` filled in; default is to create a new job JSON file with the first value on the JSON `project` empty if no flag is provided 
- `-nme` with a value immediately following, or `--name` with a value immediately following, to create a new job JSON file with the `customer.name` value filled in; default is empty
- `-d` with a dollar amount using two decimal places immediately following, or `--discount` with a dollar amount using two decimal places immediately following, to create a new job JSON file with the `discount.amount_off` value filled in, where the value is in pennies; default is to create a new job JSON file with the `discount.amount_off` value empty if no flag is provided 
- `-c` with a dollar amount using two decimal places immediately following, or `--cost` with a dollar amount using two decimal places immediately following, for that amount to be divided by 2 and then placed into price1.unit_amount and price2.unit_amount as a value in pennies 

### Installed Script (repo)

The generator script is included in the repo at:

- `assets/scripts/new_job.py`
- `assets/scripts/job.sh`

To install locally:

1. `ln -s /Users/seanivore/Development/freelance-payments/assets/scripts/job.sh ~/bin/job`
2. `chmod +x ~/bin/job`
3. Run: `job --help`