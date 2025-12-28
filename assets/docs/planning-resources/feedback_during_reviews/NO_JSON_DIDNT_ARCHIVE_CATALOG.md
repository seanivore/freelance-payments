# JSON Directory Empty, Didn't Archive Stripe Catalog Product 

## Summary 

  * **You just made two critical fixes after an error when adding a JSON where object created but no JSON file update after** 

    Fixed: Two critical issues
    Issue 1: JSON file not saving
    Problem: save_job() used relative paths (Path(jobs_dir)) while list_all_jobs() resolved relative to project root, causing saves to the wrong location.
    Fix: Updated save_job() and find_job_file() to resolve paths relative to project root (consistent with list_all_jobs()).
    Added: Debug logging to confirm save location.
    Issue 2: DEBUG messages treated as errors
    Problem: Error filtering checked the entire stderr string, so DEBUG messages were still flagged.
    Fix: Filter line-by-line, excluding lines starting with DEBUG: or Warning:, and only flagging lines with actual error indicators.
    What should happen now
    Stripe objects created → Price IDs stored in initial_price_object.id and balance_price_object.id
    JSON file saved → With Stripe IDs in state_management.object.price[] and price objects
    Checkout session updated → line_items[].price populated with Stripe price_id
    No false errors → DEBUG messages filtered out
    Workflow succeeds → Exit code 0 when no actual errors
    Next test
    Push the JSON file again. You should see:
    Stripe objects created
    JSON file updated with price_ids
    Successfully saved job uid-test-001  in logs
    Workflow exits with code 0 (no false errors)
    The path resolution fix should ensure the JSON file is saved to the correct location with all Stripe IDs populated.

  * **Before testing that fix, I went to simply remove the JSON from the directory**

  - I needed to remove the JSON file from the directory before I could text your fix 
  - When removed, then pushed, the 'Orchestrate Workflow' and then 'GitHub Pages Build' workflow both ran with no errors 
  - But the Stripe Product Object for the removed JSON file was not archived 

### Where Is The Error 

  * **What should have happened** 

  1. The workflow runs and saw that there was ZERO JSON files in the directory 
  2. Then it compares the (lack of) directory filenames to the manifest 
  3. The manifest was accurate in that it did show one Product ID/filename reflecting the product in the Catalog 
  4. No JSON but existing catalog object requires that catalog product object be archived via `active: false` 
  5. No API calls to Stripe were made at all 

  + What went wrong and where? 

  * **HOWEVER** I just went to push and save this bug report and pulled first to get the manifest and it WAS updated so it now says on the manifest that there are no products in the catalog which is in accurate because there was, it just didn't archive. Note that the manifest DID say there was one product in the catalog when it should have been checking to see if the "no json files in directory" matched an empty manifest and it didn't 

## Orchestrate Workflow 

1. orchestrate 

  2025-12-28T05:53:17.2771537Z Current runner version: '2.330.0'
  2025-12-28T05:53:17.2794570Z ##[group]Runner Image Provisioner
  2025-12-28T05:53:17.2795429Z Hosted Compute Agent
  2025-12-28T05:53:17.2796082Z Version: 20251211.462
  2025-12-28T05:53:17.2796641Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-28T05:53:17.2797360Z Build Date: 2025-12-11T16:28:49Z
  2025-12-28T05:53:17.2797991Z Worker ID: {36fce3eb-96d2-4d96-a8a0-6217c11623db}
  2025-12-28T05:53:17.2798675Z ##[endgroup]
  2025-12-28T05:53:17.2799187Z ##[group]Operating System
  2025-12-28T05:53:17.2799711Z Ubuntu
  2025-12-28T05:53:17.2800182Z 24.04.3
  2025-12-28T05:53:17.2800627Z LTS
  2025-12-28T05:53:17.2801330Z ##[endgroup]
  2025-12-28T05:53:17.2801827Z ##[group]Runner Image
  2025-12-28T05:53:17.2802319Z Image: ubuntu-24.04
  2025-12-28T05:53:17.2802866Z Version: 20251215.174.1
  2025-12-28T05:53:17.2803877Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-28T05:53:17.2805388Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-28T05:53:17.2806396Z ##[endgroup]
  2025-12-28T05:53:17.2807323Z ##[group]GITHUB_TOKEN Permissions
  2025-12-28T05:53:17.2809118Z Contents: write
  2025-12-28T05:53:17.2809701Z Metadata: read
  2025-12-28T05:53:17.2810372Z ##[endgroup]
  2025-12-28T05:53:17.2813170Z Secret source: Actions
  2025-12-28T05:53:17.2814214Z Prepare workflow directory
  2025-12-28T05:53:17.3133799Z Prepare all required actions
  2025-12-28T05:53:17.3171885Z Getting action download info
  2025-12-28T05:53:17.5963068Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
  2025-12-28T05:53:17.7011867Z Download action repository 'actions/setup-python@v4' (SHA:7f4fc3e22c37d6ff65e88745f38bd3157c663f7c)
  2025-12-28T05:53:17.9314071Z Complete job name: orchestrate
  2025-12-28T05:53:18.0014509Z ##[group]Run actions/checkout@v4
  2025-12-28T05:53:18.0015323Z with:
  2025-12-28T05:53:18.0015904Z   token: ***
  2025-12-28T05:53:18.0016279Z   fetch-depth: 0
  2025-12-28T05:53:18.0016742Z   repository: seanivore/freelance-payments
  2025-12-28T05:53:18.0017261Z   ssh-strict: true
  2025-12-28T05:53:18.0017648Z   ssh-user: git
  2025-12-28T05:53:18.0018051Z   persist-credentials: true
  2025-12-28T05:53:18.0018475Z   clean: true
  2025-12-28T05:53:18.0019005Z   sparse-checkout-cone-mode: true
  2025-12-28T05:53:18.0019719Z   fetch-tags: false
  2025-12-28T05:53:18.0020275Z   show-progress: true
  2025-12-28T05:53:18.0021071Z   lfs: false
  2025-12-28T05:53:18.0021537Z   submodules: false
  2025-12-28T05:53:18.0021942Z   set-safe-directory: true
  2025-12-28T05:53:18.0022705Z ##[endgroup]
  2025-12-28T05:53:18.1099308Z Syncing repository: seanivore/freelance-payments
  2025-12-28T05:53:18.1101367Z ##[group]Getting Git version info
  2025-12-28T05:53:18.1102266Z Working directory is '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-28T05:53:18.1103299Z [command]/usr/bin/git version
  2025-12-28T05:53:18.1215383Z git version 2.52.0
  2025-12-28T05:53:18.1242532Z ##[endgroup]
  2025-12-28T05:53:18.1266070Z Temporarily overriding HOME='/home/runner/work/_temp/cdea8419-8995-428b-8205-d0204845a766' before making global git config changes
  2025-12-28T05:53:18.1268432Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-28T05:53:18.1273312Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:18.1317945Z Deleting the contents of '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-28T05:53:18.1322047Z ##[group]Initializing the repository
  2025-12-28T05:53:18.1326838Z [command]/usr/bin/git init /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:18.1473263Z hint: Using 'master' as the name for the initial branch. This default branch name
  2025-12-28T05:53:18.1474808Z hint: will change to "main" in Git 3.0. To configure the initial branch name
  2025-12-28T05:53:18.1475679Z hint: to use in all of your new repositories, which will suppress this warning,
  2025-12-28T05:53:18.1476897Z hint: call:
  2025-12-28T05:53:18.1477556Z hint:
  2025-12-28T05:53:18.1478114Z hint: 	git config --global init.defaultBranch <name>
  2025-12-28T05:53:18.1478747Z hint:
  2025-12-28T05:53:18.1479716Z hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
  2025-12-28T05:53:18.1481698Z hint: 'development'. The just-created branch can be renamed via this command:
  2025-12-28T05:53:18.1482957Z hint:
  2025-12-28T05:53:18.1483652Z hint: 	git branch -m <name>
  2025-12-28T05:53:18.1484486Z hint:
  2025-12-28T05:53:18.1485527Z hint: Disable this message with "git config set advice.defaultBranchName false"
  2025-12-28T05:53:18.1487420Z Initialized empty Git repository in /home/runner/work/freelance-payments/freelance-payments/.git/
  2025-12-28T05:53:18.1492348Z [command]/usr/bin/git remote add origin https://github.com/seanivore/freelance-payments
  2025-12-28T05:53:18.1528943Z ##[endgroup]
  2025-12-28T05:53:18.1529921Z ##[group]Disabling automatic garbage collection
  2025-12-28T05:53:18.1533055Z [command]/usr/bin/git config --local gc.auto 0
  2025-12-28T05:53:18.1561414Z ##[endgroup]
  2025-12-28T05:53:18.1562063Z ##[group]Setting up auth
  2025-12-28T05:53:18.1568009Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-28T05:53:18.1597700Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-28T05:53:18.1969098Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-28T05:53:18.2000069Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-28T05:53:18.2218399Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-28T05:53:18.2250223Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-28T05:53:18.2472678Z [command]/usr/bin/git config --local http.https://github.com/.extraheader AUTHORIZATION: basic ***
  2025-12-28T05:53:18.2510111Z ##[endgroup]
  2025-12-28T05:53:18.2511439Z ##[group]Fetching the repository
  2025-12-28T05:53:18.2522737Z [command]/usr/bin/git -c protocol.version=2 fetch --prune --no-recurse-submodules origin +refs/heads/*:refs/remotes/origin/* +refs/tags/*:refs/tags/*
  2025-12-28T05:53:18.4986784Z From https://github.com/seanivore/freelance-payments
  2025-12-28T05:53:18.4987881Z  * [new branch]      backup-pre-modular-refactor-2025-12-20 -> origin/backup-pre-modular-refactor-2025-12-20
  2025-12-28T05:53:18.4988874Z  * [new branch]      freelance-payments -> origin/freelance-payments
  2025-12-28T05:53:18.5031795Z [command]/usr/bin/git branch --list --remote origin/freelance-payments
  2025-12-28T05:53:18.5054995Z   origin/freelance-payments
  2025-12-28T05:53:18.5063745Z [command]/usr/bin/git rev-parse refs/remotes/origin/freelance-payments
  2025-12-28T05:53:18.5083271Z 4cd730e09a56d5e43187728da00caa41c2833fe2
  2025-12-28T05:53:18.5087931Z ##[endgroup]
  2025-12-28T05:53:18.5088725Z ##[group]Determining the checkout info
  2025-12-28T05:53:18.5089777Z ##[endgroup]
  2025-12-28T05:53:18.5093657Z [command]/usr/bin/git sparse-checkout disable
  2025-12-28T05:53:18.5133214Z [command]/usr/bin/git config --local --unset-all extensions.worktreeConfig
  2025-12-28T05:53:18.5158039Z ##[group]Checking out the ref
  2025-12-28T05:53:18.5162498Z [command]/usr/bin/git checkout --progress --force -B freelance-payments refs/remotes/origin/freelance-payments
  2025-12-28T05:53:18.5361456Z Switched to a new branch 'freelance-payments'
  2025-12-28T05:53:18.5362914Z branch 'freelance-payments' set up to track 'origin/freelance-payments'.
  2025-12-28T05:53:18.5371366Z ##[endgroup]
  2025-12-28T05:53:18.5406100Z [command]/usr/bin/git log -1 --format=%H
  2025-12-28T05:53:18.5428931Z 4cd730e09a56d5e43187728da00caa41c2833fe2
  2025-12-28T05:53:18.5651521Z ##[group]Run actions/setup-python@v4
  2025-12-28T05:53:18.5652067Z with:
  2025-12-28T05:53:18.5652418Z   python-version: 3.x
  2025-12-28T05:53:18.5652816Z   check-latest: false
  2025-12-28T05:53:18.5653340Z   token: ***
  2025-12-28T05:53:18.5653697Z   update-environment: true
  2025-12-28T05:53:18.5654126Z   allow-prereleases: false
  2025-12-28T05:53:18.5654527Z ##[endgroup]
  2025-12-28T05:53:18.7340213Z ##[group]Installed versions
  2025-12-28T05:53:18.7827630Z Successfully set up CPython (3.14.2)
  2025-12-28T05:53:18.7829871Z ##[endgroup]
  2025-12-28T05:53:18.7962513Z ##[group]Run pip install stripe
  2025-12-28T05:53:18.7963407Z [36;1mpip install stripe[0m
  2025-12-28T05:53:18.8076440Z shell: /usr/bin/bash -e {0}
  2025-12-28T05:53:18.8077164Z env:
  2025-12-28T05:53:18.8077891Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:18.8079350Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-28T05:53:18.8081043Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:18.8082360Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:18.8083621Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:18.8084892Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-28T05:53:18.8085919Z ##[endgroup]
  2025-12-28T05:53:22.3020132Z Collecting stripe
  2025-12-28T05:53:22.3625065Z   Downloading stripe-14.1.0-py3-none-any.whl.metadata (18 kB)
  2025-12-28T05:53:22.3914913Z Collecting typing_extensions>=4.5.0 (from stripe)
  2025-12-28T05:53:22.3948927Z   Downloading typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
  2025-12-28T05:53:22.4226758Z Collecting requests>=2.20 (from stripe)
  2025-12-28T05:53:22.4262289Z   Downloading requests-2.32.5-py3-none-any.whl.metadata (4.9 kB)
  2025-12-28T05:53:22.5192891Z Collecting charset_normalizer<4,>=2 (from requests>=2.20->stripe)
  2025-12-28T05:53:22.5261802Z   Downloading charset_normalizer-3.4.4-cp314-cp314-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (37 kB)
  2025-12-28T05:53:22.5546730Z Collecting idna<4,>=2.5 (from requests>=2.20->stripe)
  2025-12-28T05:53:22.5581301Z   Downloading idna-3.11-py3-none-any.whl.metadata (8.4 kB)
  2025-12-28T05:53:22.5872814Z Collecting urllib3<3,>=1.21.1 (from requests>=2.20->stripe)
  2025-12-28T05:53:22.5911975Z   Downloading urllib3-2.6.2-py3-none-any.whl.metadata (6.6 kB)
  2025-12-28T05:53:22.6155907Z Collecting certifi>=2017.4.17 (from requests>=2.20->stripe)
  2025-12-28T05:53:22.6191978Z   Downloading certifi-2025.11.12-py3-none-any.whl.metadata (2.5 kB)
  2025-12-28T05:53:22.6293194Z Downloading stripe-14.1.0-py3-none-any.whl (2.1 MB)
  2025-12-28T05:53:22.6724272Z    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 54.3 MB/s  0:00:00
  2025-12-28T05:53:22.6759113Z Downloading requests-2.32.5-py3-none-any.whl (64 kB)
  2025-12-28T05:53:22.6822809Z Downloading charset_normalizer-3.4.4-cp314-cp314-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (152 kB)
  2025-12-28T05:53:22.6886429Z Downloading idna-3.11-py3-none-any.whl (71 kB)
  2025-12-28T05:53:22.6945442Z Downloading urllib3-2.6.2-py3-none-any.whl (131 kB)
  2025-12-28T05:53:22.7007992Z Downloading certifi-2025.11.12-py3-none-any.whl (159 kB)
  2025-12-28T05:53:22.7073182Z Downloading typing_extensions-4.15.0-py3-none-any.whl (44 kB)
  2025-12-28T05:53:22.7658765Z Installing collected packages: urllib3, typing_extensions, idna, charset_normalizer, certifi, requests, stripe
  2025-12-28T05:53:24.7149400Z 
  2025-12-28T05:53:24.7166561Z Successfully installed certifi-2025.11.12 charset_normalizer-3.4.4 idna-3.11 requests-2.32.5 stripe-14.1.0 typing_extensions-4.15.0 urllib3-2.6.2
  2025-12-28T05:53:24.8884281Z ##[group]Run git config pull.rebase true
  2025-12-28T05:53:24.8884651Z [36;1mgit config pull.rebase true[0m
  2025-12-28T05:53:24.8884937Z [36;1mgit config push.autoSetupRemote true[0m
  2025-12-28T05:53:24.8919565Z shell: /usr/bin/bash -e {0}
  2025-12-28T05:53:24.8919802Z env:
  2025-12-28T05:53:24.8920042Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.8920649Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-28T05:53:24.8921178Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.8921518Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.8921854Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.8922191Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-28T05:53:24.8922470Z ##[endgroup]
  2025-12-28T05:53:24.9124734Z ##[group]Run if [ "push" == "push" ]; then
  2025-12-28T05:53:24.9125082Z [36;1mif [ "push" == "push" ]; then[0m
  2025-12-28T05:53:24.9125468Z [36;1m  python3 .github/scripts/orchestration/orchestrate_workflow.py \[0m
  2025-12-28T05:53:24.9125844Z [36;1m    --trigger push[0m
  2025-12-28T05:53:24.9126058Z [36;1melse[0m
  2025-12-28T05:53:24.9126340Z [36;1m  python3 .github/scripts/orchestration/orchestrate_workflow.py \[0m
  2025-12-28T05:53:24.9126701Z [36;1m    --trigger workflow_dispatch \[0m
  2025-12-28T05:53:24.9126952Z [36;1m    --action "" \[0m
  2025-12-28T05:53:24.9127180Z [36;1m    --job-id "" \[0m
  2025-12-28T05:53:24.9127400Z [36;1m    --payload ''[0m
  2025-12-28T05:53:24.9127620Z [36;1mfi[0m
  2025-12-28T05:53:24.9161150Z shell: /usr/bin/bash -e {0}
  2025-12-28T05:53:24.9161432Z env:
  2025-12-28T05:53:24.9161686Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.9162134Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-28T05:53:24.9162522Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.9162855Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.9163187Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-28T05:53:24.9163527Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-28T05:53:24.9164412Z   STRIPE_SECRET_KEY: ***
  2025-12-28T05:53:24.9164637Z ##[endgroup]
  2025-12-28T05:53:25.5108227Z DEBUG: sync_catalog made no changes - all files match manifest and are active
  2025-12-28T05:53:25.5688725Z Saved working directory and index state WIP on freelance-payments: 4cd730e Simply removed the single json job in the directory to see if the removal and stripe catalog archiving product rule is working properly so that, aferwards, we can retest adding the single json file and make sure that the file is updated with the price object ids this time and hopefully runs without error
  2025-12-28T05:53:25.7293892Z [freelance-payments c0c3a32] 🤖 Auto-update: Manifest update
  2025-12-28T05:53:25.7294564Z  1 file changed, 2 insertions(+), 9 deletions(-)
  2025-12-28T05:53:26.1065598Z To https://github.com/seanivore/freelance-payments
  2025-12-28T05:53:26.1066196Z    4cd730e..c0c3a32  freelance-payments -> freelance-payments
  2025-12-28T05:53:26.1109299Z {
  2025-12-28T05:53:26.1109589Z   "trigger": "push",
  2025-12-28T05:53:26.1109939Z   "action": null,
  2025-12-28T05:53:26.1110201Z   "steps_run": [
  2025-12-28T05:53:26.1110501Z     "sync_catalog",
  2025-12-28T05:53:26.1111157Z     "generate_manifest"
  2025-12-28T05:53:26.1111528Z   ],
  2025-12-28T05:53:26.1111813Z   "errors": [],
  2025-12-28T05:53:26.1112132Z   "committed": true,
  2025-12-28T05:53:26.1112463Z   "pushed": true
  2025-12-28T05:53:26.1112775Z }
  2025-12-28T05:53:26.1262440Z Post job cleanup.
  2025-12-28T05:53:26.2897328Z Post job cleanup.
  2025-12-28T05:53:26.3836295Z [command]/usr/bin/git version
  2025-12-28T05:53:26.3873393Z git version 2.52.0
  2025-12-28T05:53:26.3917669Z Temporarily overriding HOME='/home/runner/work/_temp/2c474aaf-3b18-4290-8ab4-b42e40339cf3' before making global git config changes
  2025-12-28T05:53:26.3919004Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-28T05:53:26.3924338Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:26.3960127Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-28T05:53:26.3992878Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-28T05:53:26.4220422Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-28T05:53:26.4241417Z http.https://github.com/.extraheader
  2025-12-28T05:53:26.4254248Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
  2025-12-28T05:53:26.4284247Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-28T05:53:26.4506152Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-28T05:53:26.4536594Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-28T05:53:26.4864119Z Cleaning up orphan processes

  ## GitHub Pages Build 

    1. build 

    2025-12-28T05:53:17.2719702Z Current runner version: '2.330.0'
  2025-12-28T05:53:17.2753788Z ##[group]Runner Image Provisioner
  2025-12-28T05:53:17.2755061Z Hosted Compute Agent
  2025-12-28T05:53:17.2756191Z Version: 20251211.462
  2025-12-28T05:53:17.2757329Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-28T05:53:17.2758446Z Build Date: 2025-12-11T16:28:49Z
  2025-12-28T05:53:17.2759564Z Worker ID: {5a7e6e2c-4b5c-4643-ba30-7e44c68351cc}
  2025-12-28T05:53:17.2760675Z ##[endgroup]
  2025-12-28T05:53:17.2761531Z ##[group]Operating System
  2025-12-28T05:53:17.2762472Z Ubuntu
  2025-12-28T05:53:17.2763376Z 24.04.3
  2025-12-28T05:53:17.2764103Z LTS
  2025-12-28T05:53:17.2764899Z ##[endgroup]
  2025-12-28T05:53:17.2765748Z ##[group]Runner Image
  2025-12-28T05:53:17.2766921Z Image: ubuntu-24.04
  2025-12-28T05:53:17.2767827Z Version: 20251215.174.1
  2025-12-28T05:53:17.2769675Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-28T05:53:17.2772411Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-28T05:53:17.2774177Z ##[endgroup]
  2025-12-28T05:53:17.2776094Z ##[group]GITHUB_TOKEN Permissions
  2025-12-28T05:53:17.2779068Z Contents: read
  2025-12-28T05:53:17.2779939Z Metadata: read
  2025-12-28T05:53:17.2780912Z Packages: read
  2025-12-28T05:53:17.2781714Z ##[endgroup]
  2025-12-28T05:53:17.2784608Z Secret source: Actions
  2025-12-28T05:53:17.2786512Z Prepare workflow directory
  2025-12-28T05:53:17.3264357Z Prepare all required actions
  2025-12-28T05:53:17.3322172Z Getting action download info
  2025-12-28T05:53:17.6461304Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
  2025-12-28T05:53:17.7950381Z Download action repository 'actions/configure-pages@v5' (SHA:983d7736d9b0ae728b81ab479565c72886d7745b)
  2025-12-28T05:53:18.0375831Z Download action repository 'ruby/setup-ruby@v1' (SHA:ae195bbe749a7cef685ac729197124a48305c1cb)
  2025-12-28T05:53:18.2630326Z Download action repository 'actions/upload-pages-artifact@v3' (SHA:56afc609e74202658d3ffba0e8f6dda462b719fa)
  2025-12-28T05:53:18.7228398Z Getting action download info
  2025-12-28T05:53:18.8333391Z Download action repository 'actions/upload-artifact@v4' (SHA:ea165f8d65b6e75b540449e92b4886f43607fa02)
  2025-12-28T05:53:18.9629182Z Complete job name: build
  2025-12-28T05:53:19.0332631Z ##[group]Run actions/checkout@v4
  2025-12-28T05:53:19.0333473Z with:
  2025-12-28T05:53:19.0333909Z   repository: seanivore/freelance-payments
  2025-12-28T05:53:19.0334761Z   token: ***
  2025-12-28T05:53:19.0335168Z   ssh-strict: true
  2025-12-28T05:53:19.0335587Z   ssh-user: git
  2025-12-28T05:53:19.0336283Z   persist-credentials: true
  2025-12-28T05:53:19.0336776Z   clean: true
  2025-12-28T05:53:19.0337194Z   sparse-checkout-cone-mode: true
  2025-12-28T05:53:19.0337689Z   fetch-depth: 1
  2025-12-28T05:53:19.0338084Z   fetch-tags: false
  2025-12-28T05:53:19.0338500Z   show-progress: true
  2025-12-28T05:53:19.0338916Z   lfs: false
  2025-12-28T05:53:19.0339291Z   submodules: false
  2025-12-28T05:53:19.0339729Z   set-safe-directory: true
  2025-12-28T05:53:19.0340480Z ##[endgroup]
  2025-12-28T05:53:19.1396684Z Syncing repository: seanivore/freelance-payments
  2025-12-28T05:53:19.1398581Z ##[group]Getting Git version info
  2025-12-28T05:53:19.1399469Z Working directory is '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-28T05:53:19.1400536Z [command]/usr/bin/git version
  2025-12-28T05:53:19.1507036Z git version 2.52.0
  2025-12-28T05:53:19.1532456Z ##[endgroup]
  2025-12-28T05:53:19.1546279Z Temporarily overriding HOME='/home/runner/work/_temp/52351684-535d-45a5-9c47-c28137239ca3' before making global git config changes
  2025-12-28T05:53:19.1547769Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-28T05:53:19.1551517Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:19.1592369Z Deleting the contents of '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-28T05:53:19.1595670Z ##[group]Initializing the repository
  2025-12-28T05:53:19.1599746Z [command]/usr/bin/git init /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:19.1716221Z hint: Using 'master' as the name for the initial branch. This default branch name
  2025-12-28T05:53:19.1717542Z hint: will change to "main" in Git 3.0. To configure the initial branch name
  2025-12-28T05:53:19.1719070Z hint: to use in all of your new repositories, which will suppress this warning,
  2025-12-28T05:53:19.1720260Z hint: call:
  2025-12-28T05:53:19.1720857Z hint:
  2025-12-28T05:53:19.1721782Z hint: 	git config --global init.defaultBranch <name>
  2025-12-28T05:53:19.1722705Z hint:
  2025-12-28T05:53:19.1723460Z hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
  2025-12-28T05:53:19.1724356Z hint: 'development'. The just-created branch can be renamed via this command:
  2025-12-28T05:53:19.1725068Z hint:
  2025-12-28T05:53:19.1725473Z hint: 	git branch -m <name>
  2025-12-28T05:53:19.1726406Z hint:
  2025-12-28T05:53:19.1727054Z hint: Disable this message with "git config set advice.defaultBranchName false"
  2025-12-28T05:53:19.1728621Z Initialized empty Git repository in /home/runner/work/freelance-payments/freelance-payments/.git/
  2025-12-28T05:53:19.1733257Z [command]/usr/bin/git remote add origin https://github.com/seanivore/freelance-payments
  2025-12-28T05:53:19.1767857Z ##[endgroup]
  2025-12-28T05:53:19.1768584Z ##[group]Disabling automatic garbage collection
  2025-12-28T05:53:19.1771626Z [command]/usr/bin/git config --local gc.auto 0
  2025-12-28T05:53:19.1799667Z ##[endgroup]
  2025-12-28T05:53:19.1800349Z ##[group]Setting up auth
  2025-12-28T05:53:19.1806202Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-28T05:53:19.1835154Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-28T05:53:19.2188240Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-28T05:53:19.2216008Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-28T05:53:19.2445381Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-28T05:53:19.2475396Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-28T05:53:19.2719516Z [command]/usr/bin/git config --local http.https://github.com/.extraheader AUTHORIZATION: basic ***
  2025-12-28T05:53:19.2757380Z ##[endgroup]
  2025-12-28T05:53:19.2758626Z ##[group]Fetching the repository
  2025-12-28T05:53:19.2766340Z [command]/usr/bin/git -c protocol.version=2 fetch --no-tags --prune --no-recurse-submodules --depth=1 origin +4cd730e09a56d5e43187728da00caa41c2833fe2:refs/remotes/origin/freelance-payments
  2025-12-28T05:53:19.5042590Z From https://github.com/seanivore/freelance-payments
  2025-12-28T05:53:19.5044089Z  * [new ref]         4cd730e09a56d5e43187728da00caa41c2833fe2 -> origin/freelance-payments
  2025-12-28T05:53:19.5075340Z ##[endgroup]
  2025-12-28T05:53:19.5076276Z ##[group]Determining the checkout info
  2025-12-28T05:53:19.5077767Z ##[endgroup]
  2025-12-28T05:53:19.5082680Z [command]/usr/bin/git sparse-checkout disable
  2025-12-28T05:53:19.5123854Z [command]/usr/bin/git config --local --unset-all extensions.worktreeConfig
  2025-12-28T05:53:19.5149624Z ##[group]Checking out the ref
  2025-12-28T05:53:19.5153240Z [command]/usr/bin/git checkout --progress --force -B freelance-payments refs/remotes/origin/freelance-payments
  2025-12-28T05:53:19.5341326Z Switched to a new branch 'freelance-payments'
  2025-12-28T05:53:19.5344125Z branch 'freelance-payments' set up to track 'origin/freelance-payments'.
  2025-12-28T05:53:19.5351442Z ##[endgroup]
  2025-12-28T05:53:19.5385045Z [command]/usr/bin/git log -1 --format=%H
  2025-12-28T05:53:19.5406473Z 4cd730e09a56d5e43187728da00caa41c2833fe2
  2025-12-28T05:53:19.5597577Z ##[group]Run actions/configure-pages@v5
  2025-12-28T05:53:19.5598134Z with:
  2025-12-28T05:53:19.5598657Z   token: ***
  2025-12-28T05:53:19.5599038Z   enablement: false
  2025-12-28T05:53:19.5599433Z ##[endgroup]
  2025-12-28T05:53:19.9867218Z ##[group]Run ruby/setup-ruby@v1
  2025-12-28T05:53:19.9868319Z with:
  2025-12-28T05:53:19.9869127Z   ruby-version: 3.1
  2025-12-28T05:53:19.9870044Z   bundler-cache: false
  2025-12-28T05:53:19.9870964Z env:
  2025-12-28T05:53:19.9871746Z   GITHUB_PAGES: true
  2025-12-28T05:53:19.9872625Z ##[endgroup]
  2025-12-28T05:53:20.1428246Z ##[group]Modifying PATH
  2025-12-28T05:53:20.1432627Z Entries added to PATH to use selected Ruby:
  2025-12-28T05:53:20.1436853Z   /opt/hostedtoolcache/Ruby/3.1.7/x64/bin
  2025-12-28T05:53:20.1448636Z ##[endgroup]
  2025-12-28T05:53:20.1465266Z ##[group]Downloading Ruby
  2025-12-28T05:53:20.1467626Z https://github.com/ruby/ruby-builder/releases/download/ruby-3.1.7/ruby-3.1.7-ubuntu-24.04-x64.tar.gz
  2025-12-28T05:53:20.5138744Z Took   0.37 seconds
  2025-12-28T05:53:20.5140942Z ##[endgroup]
  2025-12-28T05:53:20.5142620Z ##[group]Extracting  Ruby
  2025-12-28T05:53:20.5174424Z [command]/usr/bin/tar -xz -C /opt/hostedtoolcache/Ruby/3.1.7 -f /home/runner/work/_temp/307f2451-a814-42fd-aed4-5249b0cfa4be
  2025-12-28T05:53:20.9124008Z Took   0.40 seconds
  2025-12-28T05:53:20.9127370Z ##[endgroup]
  2025-12-28T05:53:20.9129501Z ##[group]Print Ruby version
  2025-12-28T05:53:20.9145633Z [command]/opt/hostedtoolcache/Ruby/3.1.7/x64/bin/ruby --version
  2025-12-28T05:53:20.9331139Z ruby 3.1.7p261 (2025-03-26 revision 0a3704f218) [x86_64-linux]
  2025-12-28T05:53:20.9351832Z Took   0.02 seconds
  2025-12-28T05:53:20.9354005Z ##[endgroup]
  2025-12-28T05:53:20.9356056Z ##[group]Installing Bundler
  2025-12-28T05:53:20.9359535Z Using Bundler shipped with ruby-3.1.7
  2025-12-28T05:53:20.9361047Z Took   0.00 seconds
  2025-12-28T05:53:20.9362924Z ##[endgroup]
  2025-12-28T05:53:20.9505343Z ##[group]Run gem install jekyll
  2025-12-28T05:53:20.9506533Z [36;1mgem install jekyll[0m
  2025-12-28T05:53:20.9546787Z shell: /usr/bin/bash -e {0}
  2025-12-28T05:53:20.9547639Z env:
  2025-12-28T05:53:20.9548250Z   GITHUB_PAGES: true
  2025-12-28T05:53:20.9548976Z ##[endgroup]
  2025-12-28T05:53:22.9121006Z Successfully installed webrick-1.9.2
  2025-12-28T05:53:22.9121754Z Successfully installed unicode-display_width-2.6.0
  2025-12-28T05:53:22.9122401Z Successfully installed terminal-table-3.0.2
  2025-12-28T05:53:22.9122991Z Successfully installed safe_yaml-1.0.5
  2025-12-28T05:53:22.9123557Z Successfully installed rouge-4.6.1
  2025-12-28T05:53:22.9124200Z Successfully installed forwardable-extended-2.6.0
  2025-12-28T05:53:22.9124892Z Successfully installed pathutil-0.16.2
  2025-12-28T05:53:22.9125485Z Successfully installed mercenary-0.4.0
  2025-12-28T05:53:22.9126395Z Successfully installed liquid-4.0.4
  2025-12-28T05:53:22.9126914Z Successfully installed kramdown-2.5.1
  2025-12-28T05:53:22.9127572Z Successfully installed kramdown-parser-gfm-1.1.0
  2025-12-28T05:53:22.9128250Z Successfully installed ffi-1.17.2-x86_64-linux-gnu
  2025-12-28T05:53:22.9128923Z Successfully installed rb-inotify-0.11.1
  2025-12-28T05:53:22.9129468Z Successfully installed rb-fsevent-0.11.2
  2025-12-28T05:53:22.9129947Z Successfully installed listen-3.9.0
  2025-12-28T05:53:22.9130492Z Successfully installed jekyll-watch-2.2.1
  2025-12-28T05:53:22.9131104Z Successfully installed google-protobuf-4.33.2-x86_64-linux-gnu
  2025-12-28T05:53:22.9131815Z Building native extensions. This could take a while...
  2025-12-28T05:53:23.6414479Z Successfully installed sass-embedded-1.97.1
  2025-12-28T05:53:23.6415168Z Successfully installed jekyll-sass-converter-3.1.0
  2025-12-28T05:53:23.6416378Z Successfully installed concurrent-ruby-1.3.6
  2025-12-28T05:53:23.6417096Z Successfully installed i18n-1.14.8
  2025-12-28T05:53:23.6417831Z Building native extensions. This could take a while...
  2025-12-28T05:53:27.1428120Z Successfully installed http_parser.rb-0.8.1
  2025-12-28T05:53:27.1428993Z Building native extensions. This could take a while...
  2025-12-28T05:53:39.9091853Z Successfully installed eventmachine-1.2.7
  2025-12-28T05:53:39.9092732Z Successfully installed em-websocket-0.5.3
  2025-12-28T05:53:39.9093431Z Successfully installed colorator-1.1.0
  2025-12-28T05:53:39.9094070Z Successfully installed base64-0.3.0
  2025-12-28T05:53:39.9094765Z Successfully installed public_suffix-6.0.2
  2025-12-28T05:53:39.9095504Z Successfully installed addressable-2.8.8
  2025-12-28T05:53:39.9096377Z Successfully installed jekyll-4.4.1
  2025-12-28T05:53:39.9096952Z 29 gems installed
  2025-12-28T05:53:39.9258974Z ##[group]Run jekyll build --destination _site
  2025-12-28T05:53:39.9259351Z [36;1mjekyll build --destination _site[0m
  2025-12-28T05:53:39.9291800Z shell: /usr/bin/bash -e {0}
  2025-12-28T05:53:39.9292019Z env:
  2025-12-28T05:53:39.9292188Z   GITHUB_PAGES: true
  2025-12-28T05:53:39.9292381Z ##[endgroup]
  2025-12-28T05:53:40.3185567Z Configuration file: /home/runner/work/freelance-payments/freelance-payments/_config.yml
  2025-12-28T05:53:40.3293168Z             Source: /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:40.3294091Z        Destination: /home/runner/work/freelance-payments/freelance-payments/_site
  2025-12-28T05:53:40.3294983Z  Incremental build: disabled. Enable with --incremental
  2025-12-28T05:53:40.3295564Z       Generating... 
  2025-12-28T05:53:40.3541392Z                     done in 0.025 seconds.
  2025-12-28T05:53:40.3542045Z  Auto-regeneration: disabled. Use --watch to enable.
  2025-12-28T05:53:40.3672754Z ##[group]Run actions/upload-pages-artifact@v3
  2025-12-28T05:53:40.3673050Z with:
  2025-12-28T05:53:40.3673219Z   path: _site
  2025-12-28T05:53:40.3673403Z   name: github-pages
  2025-12-28T05:53:40.3673589Z   retention-days: 1
  2025-12-28T05:53:40.3673777Z env:
  2025-12-28T05:53:40.3673929Z   GITHUB_PAGES: true
  2025-12-28T05:53:40.3674112Z ##[endgroup]
  2025-12-28T05:53:40.3756936Z ##[group]Run echo ::group::Archive artifact
  2025-12-28T05:53:40.3757236Z [36;1mecho ::group::Archive artifact[0m
  2025-12-28T05:53:40.3757486Z [36;1mtar \[0m
  2025-12-28T05:53:40.3757707Z [36;1m  --dereference --hard-dereference \[0m
  2025-12-28T05:53:40.3757984Z [36;1m  --directory "$INPUT_PATH" \[0m
  2025-12-28T05:53:40.3758254Z [36;1m  -cvf "$RUNNER_TEMP/artifact.tar" \[0m
  2025-12-28T05:53:40.3758517Z [36;1m  --exclude=.git \[0m
  2025-12-28T05:53:40.3758728Z [36;1m  --exclude=.github \[0m
  2025-12-28T05:53:40.3758930Z [36;1m  .[0m
  2025-12-28T05:53:40.3759096Z [36;1mecho ::endgroup::[0m
  2025-12-28T05:53:40.3944257Z shell: /usr/bin/sh -e {0}
  2025-12-28T05:53:40.3944514Z env:
  2025-12-28T05:53:40.3944713Z   GITHUB_PAGES: true
  2025-12-28T05:53:40.3944937Z   INPUT_PATH: _site
  2025-12-28T05:53:40.3945151Z ##[endgroup]
  2025-12-28T05:53:40.4011249Z ##[group]Archive artifact
  2025-12-28T05:53:40.4023876Z ./
  2025-12-28T05:53:40.4024164Z ./api/
  2025-12-28T05:53:40.4024476Z ./api/update-payment.js
  2025-12-28T05:53:40.4024821Z ./api/track-event.js
  2025-12-28T05:53:40.4025133Z ./api/webhook.js
  2025-12-28T05:53:40.4025483Z ./api/create-checkout-session.js
  2025-12-28T05:53:40.4026061Z ./api/sign-contract.js
  2025-12-28T05:53:40.4026397Z ./tailwind.config.js
  2025-12-28T05:53:40.4026705Z ./index.html
  2025-12-28T05:53:40.4026977Z ./assets/
  2025-12-28T05:53:40.4027235Z ./assets/media/
  2025-12-28T05:53:40.4027682Z ./assets/media/thumbnail-image-bauhaus-banking-payments.webp
  2025-12-28T05:53:40.4028869Z ./assets/media/thumbnail-image-sean-august-horvath-freelance-payments.webp
  2025-12-28T05:53:40.4031636Z ./assets/media/banking-profile-icon-photo-bauhaus.png
  2025-12-28T05:53:40.4032279Z ./assets/media/banking-profile-icon-photo-bauhaus.webp
  2025-12-28T05:53:40.4032821Z ./assets/media/profile-picture-horvath.webp
  2025-12-28T05:53:40.4033336Z ./assets/media/thumbnail-image-bauhaus-banking.webp
  2025-12-28T05:53:40.4034360Z ./assets/css/
  2025-12-28T05:53:40.4034648Z ./assets/css/styles.css
  2025-12-28T05:53:40.4034975Z ./assets/css/input.css
  2025-12-28T05:53:40.4035286Z ./assets/favicon/
  2025-12-28T05:53:40.4035597Z ./assets/favicon/site.webmanifest
  2025-12-28T05:53:40.4036489Z ./assets/favicon/favicon-96x96.png
  2025-12-28T05:53:40.4036925Z ./assets/favicon/web-app-manifest-512x512.png
  2025-12-28T05:53:40.4037408Z ./assets/favicon/web-app-manifest-192x192.png
  2025-12-28T05:53:40.4037847Z ./assets/favicon/favicon.svg
  2025-12-28T05:53:40.4038443Z ./assets/favicon/apple-touch-icon.png
  2025-12-28T05:53:40.4038851Z ./assets/favicon/favicon.ico
  2025-12-28T05:53:40.4039291Z ./assets/fonts/
  2025-12-28T05:53:40.4039639Z ./assets/fonts/AgencyFB-RegularCompressed.otf
  2025-12-28T05:53:40.4040154Z ./assets/fonts/AgencyFB-RegularCondensed.otf
  2025-12-28T05:53:40.4040701Z ./assets/docs/
  2025-12-28T05:53:40.4041002Z ./assets/docs/uid-test-004.json
  2025-12-28T05:53:40.4041378Z ./assets/docs/uid-test-007.json
  2025-12-28T05:53:40.4041807Z ./assets/docs/uid-test-001.json
  2025-12-28T05:53:40.4042195Z ./assets/docs/uid-test-005.json
  2025-12-28T05:53:40.4042562Z ./assets/docs/uid-test-006.json
  2025-12-28T05:53:40.4042924Z ./assets/docs/uid-test-003.json
  2025-12-28T05:53:40.4043291Z ./assets/docs/uid-test-008.json
  2025-12-28T05:53:40.4043641Z ./assets/docs/uid-test-002.json
  2025-12-28T05:53:40.4044025Z ./assets/docs/planning-resources/
  2025-12-28T05:53:40.4044500Z ./assets/docs/planning-resources/feedback_during_reviews/
  2025-12-28T05:53:40.4045211Z ./assets/docs/planning-resources/feedback_during_reviews/SIMPLIFIED_FLOW.md
  2025-12-28T05:53:40.4046351Z ./assets/docs/planning-resources/feedback_during_reviews/PLAN_CLARIFICATIONS.md
  2025-12-28T05:53:40.4047484Z ./assets/docs/planning-resources/feedback_during_reviews/FIXES_APPLIED.md
  2025-12-28T05:53:40.4048343Z ./assets/docs/planning-resources/feedback_during_reviews/BATCHING_RESPONSE.md
  2025-12-28T05:53:40.4049226Z ./assets/docs/planning-resources/feedback_during_reviews/CANCELED_FIRST_FLOW.md
  2025-12-28T05:53:40.4050064Z ./assets/docs/planning-resources/feedback_during_reviews/SCHEMA_V3_TESTING.md
  2025-12-28T05:53:40.4050982Z ./assets/docs/planning-resources/feedback_during_reviews/SYSTEM_REVIEW.md
  2025-12-28T05:53:40.4051792Z ./assets/docs/planning-resources/feedback_during_reviews/BUG_WORKFLOW_FIX.md
  2025-12-28T05:53:40.4052754Z ./assets/docs/planning-resources/feedback_during_reviews/CHECKOUT_SESSION_DETAILS.md
  2025-12-28T05:53:40.4053674Z ./assets/docs/planning-resources/feedback_during_reviews/CHECKOUT_SESSION_UPDATE.md
  2025-12-28T05:53:40.4054441Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/
  2025-12-28T05:53:40.4055130Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/stripe_docs_llm.txt
  2025-12-28T05:53:40.4056098Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-28T05:53:40.4056970Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-28T05:53:40.4057930Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-28T05:53:40.4058611Z ./assets/docs/planning-resources/W_I_P/
  2025-12-28T05:53:40.4059161Z ./assets/docs/planning-resources/W_I_P/test-already-signed.json
  2025-12-28T05:53:40.4059853Z ./assets/docs/planning-resources/W_I_P/test-four-payments.json
  2025-12-28T05:53:40.4060528Z ./assets/docs/planning-resources/W_I_P/test-partially-paid.json
  2025-12-28T05:53:40.4061224Z ./assets/docs/planning-resources/W_I_P/test-single-payment-v2.json
  2025-12-28T05:53:40.4061905Z ./assets/docs/planning-resources/W_I_P/test-special-chars.json
  2025-12-28T05:53:40.4062531Z ./assets/docs/planning-resources/W_I_P/test-all-paid.json
  2025-12-28T05:53:40.4063273Z ./assets/docs/planning-resources/W_I_P/test-multi-payment.json
  2025-12-28T05:53:40.4063947Z ./assets/docs/planning-resources/W_I_P/test-long-description.json
  2025-12-28T05:53:40.4064627Z ./assets/docs/planning-resources/W_I_P/test-single-payment.json
  2025-12-28T05:53:40.4065290Z ./assets/docs/planning-resources/reports/
  2025-12-28T05:53:40.4065778Z ./assets/docs/planning-resources/reports/prices.csv
  2025-12-28T05:53:40.4066436Z ./assets/docs/planning-resources/reports/products.csv
  2025-12-28T05:53:40.4067019Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/
  2025-12-28T05:53:40.4068040Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-1.jpg
  2025-12-28T05:53:40.4069054Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/portfolio-aesthetic-example.jpg
  2025-12-28T05:53:40.4070093Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-2.jpg
  2025-12-28T05:53:40.4071099Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-3.jpg
  2025-12-28T05:53:40.4071874Z ./assets/docs/planning-resources/EXAMPLE_FILES/
  2025-12-28T05:53:40.4072526Z ./assets/docs/planning-resources/EXAMPLE_FILES/generate_manifest_example.py
  2025-12-28T05:53:40.4073327Z ./assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-28T05:53:40.4074131Z ./assets/docs/planning-resources/EXAMPLE_FILES/entry-controller_example.js
  2025-12-28T05:53:40.4074903Z ./assets/docs/planning-resources/EXAMPLE_FILES/manifest_example.yml
  2025-12-28T05:53:40.4075618Z ./assets/docs/planning-resources/EXAMPLE_FILES/styles_example.css
  2025-12-28T05:53:40.4076419Z ./assets/docs/planning-resources/EXAMPLE_FILES/404_example.html
  2025-12-28T05:53:40.4077139Z ./assets/docs/planning-resources/EXAMPLE_FILES/data-loader_example.js
  2025-12-28T05:53:40.4077802Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/
  2025-12-28T05:53:40.4078378Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-28T05:53:40.4079099Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-28T05:53:40.4079619Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-28T05:53:40.4080109Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-28T05:53:40.4080475Z ./assets/templates/
  2025-12-28T05:53:40.4080689Z ./assets/templates/invoice-template.html
  2025-12-28T05:53:40.4080959Z ./assets/templates/contract-template.html
  2025-12-28T05:53:40.4081190Z ./assets/js/
  2025-12-28T05:53:40.4081371Z ./assets/js/manifest.json
  2025-12-28T05:53:40.4081581Z ./assets/js/contract-controller.js
  2025-12-28T05:53:40.4081818Z ./assets/js/payment-lookup.js
  2025-12-28T05:53:40.4082033Z ./assets/js/components/
  2025-12-28T05:53:40.4082238Z ./assets/js/components/button.js
  2025-12-28T05:53:40.4082456Z ./assets/js/components/card.js
  2025-12-28T05:53:40.4082672Z ./assets/js/components/input.js
  2025-12-28T05:53:40.4082885Z ./assets/js/payment-router.js
  2025-12-28T05:53:40.4083115Z ./assets/js/checkout-controller.js
  2025-12-28T05:53:40.4083350Z ./assets/js/invoice-controller.js
  2025-12-28T05:53:40.4083564Z ./package-lock.json
  2025-12-28T05:53:40.4083742Z ./job.html
  2025-12-28T05:53:40.4083917Z ./package.json
  2025-12-28T05:53:40.4084080Z ./CNAME
  2025-12-28T05:53:40.4084221Z ./404.html
  2025-12-28T05:53:40.4084378Z ./postcss.config.js
  2025-12-28T05:53:40.4084543Z ./vercel.json
  2025-12-28T05:53:40.4084919Z ##[endgroup]
  2025-12-28T05:53:40.4159255Z ##[group]Run actions/upload-artifact@v4
  2025-12-28T05:53:40.4159512Z with:
  2025-12-28T05:53:40.4159672Z   name: github-pages
  2025-12-28T05:53:40.4159891Z   path: /home/runner/work/_temp/artifact.tar
  2025-12-28T05:53:40.4160142Z   retention-days: 1
  2025-12-28T05:53:40.4160332Z   if-no-files-found: error
  2025-12-28T05:53:40.4160535Z   compression-level: 6
  2025-12-28T05:53:40.4160715Z   overwrite: false
  2025-12-28T05:53:40.4160903Z   include-hidden-files: false
  2025-12-28T05:53:40.4161098Z env:
  2025-12-28T05:53:40.4161252Z   GITHUB_PAGES: true
  2025-12-28T05:53:40.4161430Z ##[endgroup]
  2025-12-28T05:53:40.6302306Z With the provided path, there will be 1 file uploaded
  2025-12-28T05:53:40.6309647Z Artifact name is valid!
  2025-12-28T05:53:40.6311318Z Root directory input is valid!
  2025-12-28T05:53:40.7289774Z Beginning upload of artifact content to blob storage
  2025-12-28T05:53:40.8932832Z Uploaded bytes 1438058
  2025-12-28T05:53:40.9108198Z Finished uploading artifact content to blob storage!
  2025-12-28T05:53:40.9112656Z SHA256 digest of uploaded artifact zip is f3e27485fb7254d15df2ca88d8b8a892e514bc1cc59f5ac045f5b6eb57907389
  2025-12-28T05:53:40.9115217Z Finalizing artifact upload
  2025-12-28T05:53:41.0119232Z Artifact github-pages.zip successfully finalized. Artifact ID 4977599376
  2025-12-28T05:53:41.0120304Z Artifact github-pages has been successfully uploaded! Final size is 1438058 bytes. Artifact ID is 4977599376
  2025-12-28T05:53:41.0127851Z Artifact download URL: https://github.com/seanivore/freelance-payments/actions/runs/20549674998/artifacts/4977599376
  2025-12-28T05:53:41.0327797Z Post job cleanup.
  2025-12-28T05:53:41.1269008Z [command]/usr/bin/git version
  2025-12-28T05:53:41.1305143Z git version 2.52.0
  2025-12-28T05:53:41.1348208Z Temporarily overriding HOME='/home/runner/work/_temp/c0683a27-0693-43cd-9f2a-60d0d2b61ad3' before making global git config changes
  2025-12-28T05:53:41.1349511Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-28T05:53:41.1354523Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-28T05:53:41.1390328Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-28T05:53:41.1422962Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-28T05:53:41.1648481Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-28T05:53:41.1669101Z http.https://github.com/.extraheader
  2025-12-28T05:53:41.1681062Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
  2025-12-28T05:53:41.1710145Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-28T05:53:41.1930466Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-28T05:53:41.1961013Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-28T05:53:41.2285779Z Cleaning up orphan processes

  2. deploy 

  2025-12-28T05:53:47.3434135Z Current runner version: '2.330.0'
  2025-12-28T05:53:47.3458125Z ##[group]Runner Image Provisioner
  2025-12-28T05:53:47.3458942Z Hosted Compute Agent
  2025-12-28T05:53:47.3459542Z Version: 20251211.462
  2025-12-28T05:53:47.3460167Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-28T05:53:47.3460867Z Build Date: 2025-12-11T16:28:49Z
  2025-12-28T05:53:47.3461567Z Worker ID: {1798cccc-ec6f-4be9-a39b-ccb436b9755a}
  2025-12-28T05:53:47.3462319Z ##[endgroup]
  2025-12-28T05:53:47.3462824Z ##[group]Operating System
  2025-12-28T05:53:47.3463601Z Ubuntu
  2025-12-28T05:53:47.3464077Z 24.04.3
  2025-12-28T05:53:47.3464537Z LTS
  2025-12-28T05:53:47.3464953Z ##[endgroup]
  2025-12-28T05:53:47.3465546Z ##[group]Runner Image
  2025-12-28T05:53:47.3466090Z Image: ubuntu-24.04
  2025-12-28T05:53:47.3466563Z Version: 20251215.174.1
  2025-12-28T05:53:47.3467711Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-28T05:53:47.3469236Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-28T05:53:47.3470304Z ##[endgroup]
  2025-12-28T05:53:47.3471271Z ##[group]GITHUB_TOKEN Permissions
  2025-12-28T05:53:47.3473550Z Metadata: read
  2025-12-28T05:53:47.3474110Z Pages: write
  2025-12-28T05:53:47.3474583Z ##[endgroup]
  2025-12-28T05:53:47.3476988Z Secret source: Actions
  2025-12-28T05:53:47.3477932Z Prepare workflow directory
  2025-12-28T05:53:47.3815770Z Prepare all required actions
  2025-12-28T05:53:47.3854935Z Getting action download info
  2025-12-28T05:53:47.8073317Z Download action repository 'actions/deploy-pages@v4' (SHA:d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e)
  2025-12-28T05:53:48.5827781Z Complete job name: deploy
  2025-12-28T05:53:48.6568080Z ##[group]Run actions/deploy-pages@v4
  2025-12-28T05:53:48.6569001Z with:
  2025-12-28T05:53:48.6569567Z   token: ***
  2025-12-28T05:53:48.6569962Z   timeout: 600000
  2025-12-28T05:53:48.6570367Z   error_count: 10
  2025-12-28T05:53:48.6570781Z   reporting_interval: 5000
  2025-12-28T05:53:48.6571268Z   artifact_name: github-pages
  2025-12-28T05:53:48.6571737Z   preview: false
  2025-12-28T05:53:48.6572350Z ##[endgroup]
  2025-12-28T05:53:49.1534404Z Fetching artifact metadata for "github-pages" in this workflow run
  2025-12-28T05:53:49.3971580Z Found 1 artifact(s)
  2025-12-28T05:53:49.3986753Z Creating Pages deployment with payload:
  2025-12-28T05:53:49.3988222Z {
  2025-12-28T05:53:49.3989259Z 	"artifact_id": 4977599376,
  2025-12-28T05:53:49.3990907Z 	"pages_build_version": "4cd730e09a56d5e43187728da00caa41c2833fe2",
  2025-12-28T05:53:49.4183998Z 	"oidc_token": "***"
  2025-12-28T05:53:49.4184813Z }
  2025-12-28T05:53:49.7382062Z Created deployment for 4cd730e09a56d5e43187728da00caa41c2833fe2, ID: 4cd730e09a56d5e43187728da00caa41c2833fe2
  2025-12-28T05:53:54.7395896Z Getting Pages deployment status...
  2025-12-28T05:53:54.9402760Z Reported success!
  2025-12-28T05:53:54.9638695Z Evaluate and set environment url
  2025-12-28T05:53:54.9644184Z Evaluated environment url: https://payments.august.style/
  2025-12-28T05:53:54.9645184Z Cleaning up orphan processes