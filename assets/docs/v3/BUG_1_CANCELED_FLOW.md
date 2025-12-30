# Triggered Workflow Actions When One JSON Object Was Removed From Directory 

  1. The first one is always *BEFORE* the commit message, and it canceled by the commit message. 
  2. The second one is typically a failure in GitHub even if there are updates to the Stripe Catalog as should be. 
  3. The third one is always success, and creates accurate manifest. 

## **Always First & Canceled:** pages build and deployment (activated by seanivore)
*This failed with annotation "Canceling since a higher priority waiting request for pages build and deployment @ freelance-payments exists"* 

1. build 

  2025-12-27T23:39:13.8224336Z Current runner version: '2.330.0'
  2025-12-27T23:39:13.8250018Z ##[group]Runner Image Provisioner
  2025-12-27T23:39:13.8250786Z Hosted Compute Agent
  2025-12-27T23:39:13.8251494Z Version: 20251211.462
  2025-12-27T23:39:13.8252108Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-27T23:39:13.8252755Z Build Date: 2025-12-11T16:28:49Z
  2025-12-27T23:39:13.8253471Z Worker ID: {4232a7ec-7f96-4e6b-b205-7ff6e1c09ca4}
  2025-12-27T23:39:13.8254288Z ##[endgroup]
  2025-12-27T23:39:13.8254814Z ##[group]Operating System
  2025-12-27T23:39:13.8255419Z Ubuntu
  2025-12-27T23:39:13.8255909Z 24.04.3
  2025-12-27T23:39:13.8256360Z LTS
  2025-12-27T23:39:13.8256814Z ##[endgroup]
  2025-12-27T23:39:13.8257360Z ##[group]Runner Image
  2025-12-27T23:39:13.8258107Z Image: ubuntu-24.04
  2025-12-27T23:39:13.8258675Z Version: 20251215.174.1
  2025-12-27T23:39:13.8259669Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-27T23:39:13.8261198Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-27T23:39:13.8262285Z ##[endgroup]
  2025-12-27T23:39:13.8263298Z ##[group]GITHUB_TOKEN Permissions
  2025-12-27T23:39:13.8265622Z Contents: read
  2025-12-27T23:39:13.8266134Z Metadata: read
  2025-12-27T23:39:13.8266615Z Pages: write
  2025-12-27T23:39:13.8267168Z ##[endgroup]
  2025-12-27T23:39:13.8269258Z Secret source: Actions
  2025-12-27T23:39:13.8270292Z Prepare workflow directory
  2025-12-27T23:39:13.8619557Z Prepare all required actions
  2025-12-27T23:39:13.8658290Z Getting action download info
  2025-12-27T23:39:14.2137164Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
  2025-12-27T23:39:14.3132207Z Download action repository 'actions/jekyll-build-pages@v1' (SHA:44a6e6beabd48582f863aeeb6cb2151cc1716697)
  2025-12-27T23:39:14.6870980Z Download action repository 'actions/upload-pages-artifact@v3' (SHA:56afc609e74202658d3ffba0e8f6dda462b719fa)
  2025-12-27T23:39:15.0432152Z Getting action download info
  2025-12-27T23:39:15.1639746Z Download action repository 'actions/upload-artifact@v4' (SHA:ea165f8d65b6e75b540449e92b4886f43607fa02)
  2025-12-27T23:39:15.3040131Z Complete job name: build
  2025-12-27T23:39:15.3536192Z ##[group]Pull down action image 'ghcr.io/actions/jekyll-build-pages:v1.0.13'
  2025-12-27T23:39:15.3591485Z ##[command]/usr/bin/docker pull ghcr.io/actions/jekyll-build-pages:v1.0.13
  2025-12-27T23:39:15.9497122Z v1.0.13: Pulling from actions/jekyll-build-pages
  2025-12-27T23:39:15.9498455Z efc2b5ad9eec: Pulling fs layer
  2025-12-27T23:39:15.9499405Z 165b60d1bb48: Pulling fs layer
  2025-12-27T23:39:15.9500346Z 2a328af1ca3a: Pulling fs layer
  2025-12-27T23:39:15.9501634Z 32b58fa44788: Pulling fs layer
  2025-12-27T23:39:15.9502629Z 590ab93c22d2: Pulling fs layer
  2025-12-27T23:39:15.9503546Z 26ea96c4c14c: Pulling fs layer
  2025-12-27T23:39:15.9504751Z bd7e451dfea1: Pulling fs layer
  2025-12-27T23:39:15.9505832Z 32b58fa44788: Waiting
  2025-12-27T23:39:15.9506915Z c209e9dadc51: Pulling fs layer
  2025-12-27T23:39:15.9508296Z a4925b5c711a: Pulling fs layer
  2025-12-27T23:39:15.9509350Z cd9459784e3c: Pulling fs layer
  2025-12-27T23:39:15.9510286Z 590ab93c22d2: Waiting
  2025-12-27T23:39:15.9511125Z 26ea96c4c14c: Waiting
  2025-12-27T23:39:15.9511896Z a4925b5c711a: Waiting
  2025-12-27T23:39:15.9512675Z c209e9dadc51: Waiting
  2025-12-27T23:39:15.9513439Z cd9459784e3c: Waiting
  2025-12-27T23:39:16.0415110Z 2a328af1ca3a: Verifying Checksum
  2025-12-27T23:39:16.0416733Z 2a328af1ca3a: Download complete
  2025-12-27T23:39:16.0942621Z 165b60d1bb48: Verifying Checksum
  2025-12-27T23:39:16.0945967Z 165b60d1bb48: Download complete
  2025-12-27T23:39:16.1251644Z efc2b5ad9eec: Verifying Checksum
  2025-12-27T23:39:16.1253221Z efc2b5ad9eec: Download complete
  2025-12-27T23:39:16.1751390Z 590ab93c22d2: Verifying Checksum
  2025-12-27T23:39:16.1759344Z 590ab93c22d2: Download complete
  2025-12-27T23:39:16.2506859Z 32b58fa44788: Download complete
  2025-12-27T23:39:16.2630143Z bd7e451dfea1: Verifying Checksum
  2025-12-27T23:39:16.2632246Z bd7e451dfea1: Download complete
  2025-12-27T23:39:16.3512350Z a4925b5c711a: Verifying Checksum
  2025-12-27T23:39:16.3514250Z a4925b5c711a: Download complete
  2025-12-27T23:39:16.4377505Z cd9459784e3c: Verifying Checksum
  2025-12-27T23:39:16.4379300Z cd9459784e3c: Download complete
  2025-12-27T23:39:16.4672070Z c209e9dadc51: Verifying Checksum
  2025-12-27T23:39:16.4675239Z c209e9dadc51: Download complete
  2025-12-27T23:39:16.8081866Z 26ea96c4c14c: Verifying Checksum
  2025-12-27T23:39:17.4947216Z 26ea96c4c14c: Download complete
  2025-12-27T23:39:17.4947791Z efc2b5ad9eec: Pull complete
  2025-12-27T23:39:21.4538450Z 165b60d1bb48: Pull complete
  2025-12-27T23:39:21.4656059Z 2a328af1ca3a: Pull complete
  2025-12-27T23:39:22.4581450Z 32b58fa44788: Pull complete
  2025-12-27T23:39:22.4694907Z 590ab93c22d2: Pull complete
  2025-12-27T23:39:24.9555445Z ##[error]The operation was canceled.
  2025-12-27T23:39:24.9675794Z Cleaning up orphan processes

2. report build status 

  Canceling since a higher priority waiting request for pages build and deployment @ freelance-payments exists

3. deploy 

  Canceling since a higher priority waiting request for pages build and deployment @ freelance-payments exists

## **Always Second:** 'Name is the committed message text' (activated by seanivore)
*This failed with annotation "Process completed with exit code 1."* 

1. orchestrate 

  2025-12-27T23:39:13.5857760Z Current runner version: '2.330.0'
  2025-12-27T23:39:13.5891443Z ##[group]Runner Image Provisioner
  2025-12-27T23:39:13.5893090Z Hosted Compute Agent
  2025-12-27T23:39:13.5894180Z Version: 20251211.462
  2025-12-27T23:39:13.5895302Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-27T23:39:13.5896571Z Build Date: 2025-12-11T16:28:49Z
  2025-12-27T23:39:13.5897945Z Worker ID: {8a7ae539-e69e-4fe8-8a9a-82b9b46fbd8e}
  2025-12-27T23:39:13.5899232Z ##[endgroup]
  2025-12-27T23:39:13.5900123Z ##[group]Operating System
  2025-12-27T23:39:13.5901155Z Ubuntu
  2025-12-27T23:39:13.5901994Z 24.04.3
  2025-12-27T23:39:13.5902756Z LTS
  2025-12-27T23:39:13.5903666Z ##[endgroup]
  2025-12-27T23:39:13.5904576Z ##[group]Runner Image
  2025-12-27T23:39:13.5905450Z Image: ubuntu-24.04
  2025-12-27T23:39:13.5906522Z Version: 20251215.174.1
  2025-12-27T23:39:13.5908633Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-27T23:39:13.5911456Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-27T23:39:13.5913253Z ##[endgroup]
  2025-12-27T23:39:13.5915159Z ##[group]GITHUB_TOKEN Permissions
  2025-12-27T23:39:13.5917937Z Contents: write
  2025-12-27T23:39:13.5918952Z Metadata: read
  2025-12-27T23:39:13.5919811Z ##[endgroup]
  2025-12-27T23:39:13.5923291Z Secret source: Actions
  2025-12-27T23:39:13.5924952Z Prepare workflow directory
  2025-12-27T23:39:13.6393008Z Prepare all required actions
  2025-12-27T23:39:13.6449858Z Getting action download info
  2025-12-27T23:39:13.8816185Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
  2025-12-27T23:39:13.9828790Z Download action repository 'actions/setup-python@v4' (SHA:7f4fc3e22c37d6ff65e88745f38bd3157c663f7c)
  2025-12-27T23:39:14.1989077Z Complete job name: orchestrate
  2025-12-27T23:39:14.2681934Z ##[group]Run actions/checkout@v4
  2025-12-27T23:39:14.2682743Z with:
  2025-12-27T23:39:14.2683329Z   token: ***
  2025-12-27T23:39:14.2683693Z   fetch-depth: 0
  2025-12-27T23:39:14.2684148Z   repository: seanivore/freelance-payments
  2025-12-27T23:39:14.2684674Z   ssh-strict: true
  2025-12-27T23:39:14.2685052Z   ssh-user: git
  2025-12-27T23:39:14.2685442Z   persist-credentials: true
  2025-12-27T23:39:14.2685890Z   clean: true
  2025-12-27T23:39:14.2686286Z   sparse-checkout-cone-mode: true
  2025-12-27T23:39:14.2686760Z   fetch-tags: false
  2025-12-27T23:39:14.2687153Z   show-progress: true
  2025-12-27T23:39:14.2687720Z   lfs: false
  2025-12-27T23:39:14.2688098Z   submodules: false
  2025-12-27T23:39:14.2688495Z   set-safe-directory: true
  2025-12-27T23:39:14.2689185Z ##[endgroup]
  2025-12-27T23:39:14.3779759Z Syncing repository: seanivore/freelance-payments
  2025-12-27T23:39:14.3782528Z ##[group]Getting Git version info
  2025-12-27T23:39:14.3783987Z Working directory is '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-27T23:39:14.3785838Z [command]/usr/bin/git version
  2025-12-27T23:39:14.3871741Z git version 2.52.0
  2025-12-27T23:39:14.3898154Z ##[endgroup]
  2025-12-27T23:39:14.3914057Z Temporarily overriding HOME='/home/runner/work/_temp/e314440d-4588-4572-8935-c9a798aa2828' before making global git config changes
  2025-12-27T23:39:14.3916405Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-27T23:39:14.3928563Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:14.3969357Z Deleting the contents of '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-27T23:39:14.3972083Z ##[group]Initializing the repository
  2025-12-27T23:39:14.3976072Z [command]/usr/bin/git init /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:14.4085839Z hint: Using 'master' as the name for the initial branch. This default branch name
  2025-12-27T23:39:14.4086837Z hint: will change to "main" in Git 3.0. To configure the initial branch name
  2025-12-27T23:39:14.4088231Z hint: to use in all of your new repositories, which will suppress this warning,
  2025-12-27T23:39:14.4089714Z hint: call:
  2025-12-27T23:39:14.4090349Z hint:
  2025-12-27T23:39:14.4091099Z hint: 	git config --global init.defaultBranch <name>
  2025-12-27T23:39:14.4091997Z hint:
  2025-12-27T23:39:14.4092850Z hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
  2025-12-27T23:39:14.4093871Z hint: 'development'. The just-created branch can be renamed via this command:
  2025-12-27T23:39:14.4094539Z hint:
  2025-12-27T23:39:14.4094915Z hint: 	git branch -m <name>
  2025-12-27T23:39:14.4095346Z hint:
  2025-12-27T23:39:14.4095905Z hint: Disable this message with "git config set advice.defaultBranchName false"
  2025-12-27T23:39:14.4097129Z Initialized empty Git repository in /home/runner/work/freelance-payments/freelance-payments/.git/
  2025-12-27T23:39:14.4103327Z [command]/usr/bin/git remote add origin https://github.com/seanivore/freelance-payments
  2025-12-27T23:39:14.4137528Z ##[endgroup]
  2025-12-27T23:39:14.4138416Z ##[group]Disabling automatic garbage collection
  2025-12-27T23:39:14.4141461Z [command]/usr/bin/git config --local gc.auto 0
  2025-12-27T23:39:14.4168443Z ##[endgroup]
  2025-12-27T23:39:14.4169104Z ##[group]Setting up auth
  2025-12-27T23:39:14.4175052Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-27T23:39:14.4203922Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-27T23:39:14.4558174Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-27T23:39:14.4586710Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-27T23:39:14.4802313Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-27T23:39:14.4842467Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-27T23:39:14.5064031Z [command]/usr/bin/git config --local http.https://github.com/.extraheader AUTHORIZATION: basic ***
  2025-12-27T23:39:14.5099917Z ##[endgroup]
  2025-12-27T23:39:14.5101170Z ##[group]Fetching the repository
  2025-12-27T23:39:14.5109360Z [command]/usr/bin/git -c protocol.version=2 fetch --prune --no-recurse-submodules origin +refs/heads/*:refs/remotes/origin/* +refs/tags/*:refs/tags/*
  2025-12-27T23:39:14.7666588Z From https://github.com/seanivore/freelance-payments
  2025-12-27T23:39:14.7669024Z  * [new branch]      backup-pre-modular-refactor-2025-12-20 -> origin/backup-pre-modular-refactor-2025-12-20
  2025-12-27T23:39:14.7671954Z  * [new branch]      freelance-payments -> origin/freelance-payments
  2025-12-27T23:39:14.7734457Z [command]/usr/bin/git branch --list --remote origin/freelance-payments
  2025-12-27T23:39:14.7758896Z   origin/freelance-payments
  2025-12-27T23:39:14.7769339Z [command]/usr/bin/git rev-parse refs/remotes/origin/freelance-payments
  2025-12-27T23:39:14.7790105Z b70acaa05cfba3ff6fbbc8d35da68281ff6f16e0
  2025-12-27T23:39:14.7794489Z ##[endgroup]
  2025-12-27T23:39:14.7795690Z ##[group]Determining the checkout info
  2025-12-27T23:39:14.7797375Z ##[endgroup]
  2025-12-27T23:39:14.7802808Z [command]/usr/bin/git sparse-checkout disable
  2025-12-27T23:39:14.7866767Z [command]/usr/bin/git config --local --unset-all extensions.worktreeConfig
  2025-12-27T23:39:14.7893606Z ##[group]Checking out the ref
  2025-12-27T23:39:14.7898935Z [command]/usr/bin/git checkout --progress --force -B freelance-payments refs/remotes/origin/freelance-payments
  2025-12-27T23:39:15.1073623Z Switched to a new branch 'freelance-payments'
  2025-12-27T23:39:15.1076012Z branch 'freelance-payments' set up to track 'origin/freelance-payments'.
  2025-12-27T23:39:15.1086056Z ##[endgroup]
  2025-12-27T23:39:15.1124728Z [command]/usr/bin/git log -1 --format=%H
  2025-12-27T23:39:15.1148412Z b70acaa05cfba3ff6fbbc8d35da68281ff6f16e0
  2025-12-27T23:39:15.1392553Z ##[group]Run actions/setup-python@v4
  2025-12-27T23:39:15.1393210Z with:
  2025-12-27T23:39:15.1393641Z   python-version: 3.x
  2025-12-27T23:39:15.1394113Z   check-latest: false
  2025-12-27T23:39:15.1394741Z   token: ***
  2025-12-27T23:39:15.1395157Z   update-environment: true
  2025-12-27T23:39:15.1395672Z   allow-prereleases: false
  2025-12-27T23:39:15.1396163Z ##[endgroup]
  2025-12-27T23:39:15.3070219Z ##[group]Installed versions
  2025-12-27T23:39:15.3190088Z Successfully set up CPython (3.14.2)
  2025-12-27T23:39:15.3192089Z ##[endgroup]
  2025-12-27T23:39:15.3320957Z ##[group]Run pip install stripe
  2025-12-27T23:39:15.3321613Z [36;1mpip install stripe[0m
  2025-12-27T23:39:15.3410121Z shell: /usr/bin/bash -e {0}
  2025-12-27T23:39:15.3410651Z env:
  2025-12-27T23:39:15.3411165Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:15.3412137Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-27T23:39:15.3413080Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:15.3413926Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:15.3414764Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:15.3415618Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-27T23:39:15.3416346Z ##[endgroup]
  2025-12-27T23:39:18.1690305Z Collecting stripe
  2025-12-27T23:39:18.2365756Z   Downloading stripe-14.1.0-py3-none-any.whl.metadata (18 kB)
  2025-12-27T23:39:18.2666117Z Collecting typing_extensions>=4.5.0 (from stripe)
  2025-12-27T23:39:18.2741737Z   Downloading typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
  2025-12-27T23:39:18.3071277Z Collecting requests>=2.20 (from stripe)
  2025-12-27T23:39:18.3143346Z   Downloading requests-2.32.5-py3-none-any.whl.metadata (4.9 kB)
  2025-12-27T23:39:18.4128328Z Collecting charset_normalizer<4,>=2 (from requests>=2.20->stripe)
  2025-12-27T23:39:18.4211920Z   Downloading charset_normalizer-3.4.4-cp314-cp314-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (37 kB)
  2025-12-27T23:39:18.4511802Z Collecting idna<4,>=2.5 (from requests>=2.20->stripe)
  2025-12-27T23:39:18.4582008Z   Downloading idna-3.11-py3-none-any.whl.metadata (8.4 kB)
  2025-12-27T23:39:18.4920924Z Collecting urllib3<3,>=1.21.1 (from requests>=2.20->stripe)
  2025-12-27T23:39:18.4991861Z   Downloading urllib3-2.6.2-py3-none-any.whl.metadata (6.6 kB)
  2025-12-27T23:39:18.5258893Z Collecting certifi>=2017.4.17 (from requests>=2.20->stripe)
  2025-12-27T23:39:18.5333071Z   Downloading certifi-2025.11.12-py3-none-any.whl.metadata (2.5 kB)
  2025-12-27T23:39:18.5488690Z Downloading stripe-14.1.0-py3-none-any.whl (2.1 MB)
  2025-12-27T23:39:18.6639145Z    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 19.3 MB/s  0:00:00
  2025-12-27T23:39:18.6714202Z Downloading requests-2.32.5-py3-none-any.whl (64 kB)
  2025-12-27T23:39:18.6813347Z Downloading charset_normalizer-3.4.4-cp314-cp314-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (152 kB)
  2025-12-27T23:39:18.6927353Z Downloading idna-3.11-py3-none-any.whl (71 kB)
  2025-12-27T23:39:18.7025741Z Downloading urllib3-2.6.2-py3-none-any.whl (131 kB)
  2025-12-27T23:39:18.7138549Z Downloading certifi-2025.11.12-py3-none-any.whl (159 kB)
  2025-12-27T23:39:18.7281130Z Downloading typing_extensions-4.15.0-py3-none-any.whl (44 kB)
  2025-12-27T23:39:18.7725501Z Installing collected packages: urllib3, typing_extensions, idna, charset_normalizer, certifi, requests, stripe
  2025-12-27T23:39:20.9115622Z 
  2025-12-27T23:39:20.9139448Z Successfully installed certifi-2025.11.12 charset_normalizer-3.4.4 idna-3.11 requests-2.32.5 stripe-14.1.0 typing_extensions-4.15.0 urllib3-2.6.2
  2025-12-27T23:39:21.2902735Z ##[group]Run git config pull.rebase true
  2025-12-27T23:39:21.2903099Z [36;1mgit config pull.rebase true[0m
  2025-12-27T23:39:21.2903408Z [36;1mgit config push.autoSetupRemote true[0m
  2025-12-27T23:39:21.2938841Z shell: /usr/bin/bash -e {0}
  2025-12-27T23:39:21.2939079Z env:
  2025-12-27T23:39:21.2939319Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.2939944Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-27T23:39:21.2940327Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.2940663Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.2941016Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.2941355Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-27T23:39:21.2941636Z ##[endgroup]
  2025-12-27T23:39:21.3864799Z ##[group]Run if [ "push" == "push" ]; then
  2025-12-27T23:39:21.3865152Z [36;1mif [ "push" == "push" ]; then[0m
  2025-12-27T23:39:21.3865561Z [36;1m  python3 .github/scripts/orchestration/orchestrate_workflow.py \[0m
  2025-12-27T23:39:21.3865945Z [36;1m    --trigger push[0m
  2025-12-27T23:39:21.3866192Z [36;1melse[0m
  2025-12-27T23:39:21.3866474Z [36;1m  python3 .github/scripts/orchestration/orchestrate_workflow.py \[0m
  2025-12-27T23:39:21.3866843Z [36;1m    --trigger workflow_dispatch \[0m
  2025-12-27T23:39:21.3867100Z [36;1m    --action "" \[0m
  2025-12-27T23:39:21.3867310Z [36;1m    --job-id "" \[0m
  2025-12-27T23:39:21.3867524Z [36;1m    --payload ''[0m
  2025-12-27T23:39:21.3867976Z [36;1mfi[0m
  2025-12-27T23:39:21.3903152Z shell: /usr/bin/bash -e {0}
  2025-12-27T23:39:21.3903377Z env:
  2025-12-27T23:39:21.3903613Z   pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.3904045Z   PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
  2025-12-27T23:39:21.3904435Z   Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.3904772Z   Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.3905110Z   Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
  2025-12-27T23:39:21.3905458Z   LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
  2025-12-27T23:39:21.3906319Z   STRIPE_SECRET_KEY: ***
  2025-12-27T23:39:21.3906530Z ##[endgroup]
  2025-12-27T23:39:22.4085819Z error: cannot pull with rebase: You have unstaged changes.
  2025-12-27T23:39:22.4086933Z error: Please commit or stash them.
  2025-12-27T23:39:22.4200480Z [freelance-payments a434920] 🤖 Auto-update: Stripe catalog sync and manifest update
  2025-12-27T23:39:22.4201466Z  1 file changed, 2 insertions(+), 45 deletions(-)
  2025-12-27T23:39:22.8420434Z To https://github.com/seanivore/freelance-payments
  2025-12-27T23:39:22.8420941Z    b70acaa..a434920  freelance-payments -> freelance-payments
  2025-12-27T23:39:22.8465657Z {
  2025-12-27T23:39:22.8467197Z   "trigger": "push",
  2025-12-27T23:39:22.8467844Z   "action": null,
  2025-12-27T23:39:22.8468187Z   "steps_run": [
  2025-12-27T23:39:22.8468504Z     "sync_catalog",
  2025-12-27T23:39:22.8468829Z     "generate_manifest"
  2025-12-27T23:39:22.8469138Z   ],
  2025-12-27T23:39:22.8469401Z   "errors": [
  2025-12-27T23:39:22.8471647Z     "sync_catalog stderr: DEBUG: Looking for jobs in: /home/runner/work/freelance-payments/freelance-payments/assets/jobs\nDEBUG: Found 1 JSON file(s) in /home/runner/work/freelance-payments/freelance-payments/assets/jobs\nDEBUG: Skipping template file: _job_template_v3.json\nDEBUG: Returning 0 job(s)\nDEBUG: Found 0 job file(s) in assets/jobs\nDEBUG: Found 0 job_id(s) in manifest\n",
  2025-12-27T23:39:22.8477074Z     "sync_catalog processed 0 jobs. Stats: {'jobs_processed': 0, 'products_created': 0, 'products_modified': 0, 'prices_created': 0, 'customers_created': 0, 'coupons_created': 0, 'products_archived': 0, '_stderr': 'DEBUG: Looking for jobs in: /home/runner/work/freelance-payments/freelance-payments/assets/jobs\\nDEBUG: Found 1 JSON file(s) in /home/runner/work/freelance-payments/freelance-payments/assets/jobs\\nDEBUG: Skipping template file: _job_template_v3.json\\nDEBUG: Returning 0 job(s)\\nDEBUG: Found 0 job file(s) in assets/jobs\\nDEBUG: Found 0 job_id(s) in manifest\\n'}"
  2025-12-27T23:39:22.8480488Z   ],
  2025-12-27T23:39:22.8480767Z   "committed": true,
  2025-12-27T23:39:22.8481107Z   "pushed": true
  2025-12-27T23:39:22.8481425Z }
  2025-12-27T23:39:22.8570099Z ##[error]Process completed with exit code 1.
  2025-12-27T23:39:22.8670199Z Post job cleanup.
  2025-12-27T23:39:22.9592285Z [command]/usr/bin/git version
  2025-12-27T23:39:22.9628186Z git version 2.52.0
  2025-12-27T23:39:22.9671374Z Temporarily overriding HOME='/home/runner/work/_temp/1065bf94-9ec0-4d1a-b14e-e3e22871827d' before making global git config changes
  2025-12-27T23:39:22.9672591Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-27T23:39:22.9677078Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:22.9715468Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-27T23:39:22.9747102Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-27T23:39:22.9976884Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-27T23:39:22.9997379Z http.https://github.com/.extraheader
  2025-12-27T23:39:23.0009822Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
  2025-12-27T23:39:23.0039716Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-27T23:39:23.0262309Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-27T23:39:23.0291929Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-27T23:39:23.0618398Z Cleaning up orphan processes

### **Final Workflow Action:** pages build and deployment (by github pages bot)

  1. build 

  2025-12-27T23:39:29.0201640Z Current runner version: '2.330.0'
  2025-12-27T23:39:29.0236412Z ##[group]Runner Image Provisioner
  2025-12-27T23:39:29.0237795Z Hosted Compute Agent
  2025-12-27T23:39:29.0238760Z Version: 20251211.462
  2025-12-27T23:39:29.0240036Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-27T23:39:29.0241271Z Build Date: 2025-12-11T16:28:49Z
  2025-12-27T23:39:29.0242412Z Worker ID: {2fe303f4-2fb3-4ff5-84ff-f5ff18ac49ab}
  2025-12-27T23:39:29.0243614Z ##[endgroup]
  2025-12-27T23:39:29.0244644Z ##[group]Operating System
  2025-12-27T23:39:29.0245718Z Ubuntu
  2025-12-27T23:39:29.0246489Z 24.04.3
  2025-12-27T23:39:29.0247378Z LTS
  2025-12-27T23:39:29.0248084Z ##[endgroup]
  2025-12-27T23:39:29.0248874Z ##[group]Runner Image
  2025-12-27T23:39:29.0250164Z Image: ubuntu-24.04
  2025-12-27T23:39:29.0251099Z Version: 20251215.174.1
  2025-12-27T23:39:29.0252834Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-27T23:39:29.0255653Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-27T23:39:29.0257454Z ##[endgroup]
  2025-12-27T23:39:29.0259259Z ##[group]GITHUB_TOKEN Permissions
  2025-12-27T23:39:29.0262143Z Contents: read
  2025-12-27T23:39:29.0263106Z Metadata: read
  2025-12-27T23:39:29.0264046Z Pages: write
  2025-12-27T23:39:29.0265002Z ##[endgroup]
  2025-12-27T23:39:29.0267915Z Secret source: Actions
  2025-12-27T23:39:29.0269029Z Prepare workflow directory
  2025-12-27T23:39:29.0740483Z Prepare all required actions
  2025-12-27T23:39:29.0796656Z Getting action download info
  2025-12-27T23:39:29.3205501Z Download action repository 'actions/checkout@v4' (SHA:34e114876b0b11c390a56381ad16ebd13914f8d5)
  2025-12-27T23:39:29.4353178Z Download action repository 'actions/jekyll-build-pages@v1' (SHA:44a6e6beabd48582f863aeeb6cb2151cc1716697)
  2025-12-27T23:39:29.6623022Z Download action repository 'actions/upload-pages-artifact@v3' (SHA:56afc609e74202658d3ffba0e8f6dda462b719fa)
  2025-12-27T23:39:29.9384311Z Getting action download info
  2025-12-27T23:39:30.0771984Z Download action repository 'actions/upload-artifact@v4' (SHA:ea165f8d65b6e75b540449e92b4886f43607fa02)
  2025-12-27T23:39:30.2578658Z Complete job name: build
  2025-12-27T23:39:30.3047128Z ##[group]Pull down action image 'ghcr.io/actions/jekyll-build-pages:v1.0.13'
  2025-12-27T23:39:30.3102305Z ##[command]/usr/bin/docker pull ghcr.io/actions/jekyll-build-pages:v1.0.13
  2025-12-27T23:39:30.5786238Z v1.0.13: Pulling from actions/jekyll-build-pages
  2025-12-27T23:39:30.5787948Z efc2b5ad9eec: Pulling fs layer
  2025-12-27T23:39:30.5789316Z 165b60d1bb48: Pulling fs layer
  2025-12-27T23:39:30.5790941Z 2a328af1ca3a: Pulling fs layer
  2025-12-27T23:39:30.5792298Z 32b58fa44788: Pulling fs layer
  2025-12-27T23:39:30.5793619Z 590ab93c22d2: Pulling fs layer
  2025-12-27T23:39:30.5794973Z 26ea96c4c14c: Pulling fs layer
  2025-12-27T23:39:30.5796303Z bd7e451dfea1: Pulling fs layer
  2025-12-27T23:39:30.5797644Z c209e9dadc51: Pulling fs layer
  2025-12-27T23:39:30.5799013Z a4925b5c711a: Pulling fs layer
  2025-12-27T23:39:30.5800494Z cd9459784e3c: Pulling fs layer
  2025-12-27T23:39:30.5801803Z c209e9dadc51: Waiting
  2025-12-27T23:39:30.5802992Z 590ab93c22d2: Waiting
  2025-12-27T23:39:30.5804196Z a4925b5c711a: Waiting
  2025-12-27T23:39:30.5805381Z cd9459784e3c: Waiting
  2025-12-27T23:39:30.5806616Z 26ea96c4c14c: Waiting
  2025-12-27T23:39:30.5807795Z bd7e451dfea1: Waiting
  2025-12-27T23:39:30.5808973Z 32b58fa44788: Waiting
  2025-12-27T23:39:30.6418121Z 2a328af1ca3a: Verifying Checksum
  2025-12-27T23:39:30.6420100Z 2a328af1ca3a: Download complete
  2025-12-27T23:39:30.7101087Z 165b60d1bb48: Verifying Checksum
  2025-12-27T23:39:30.7103034Z 165b60d1bb48: Download complete
  2025-12-27T23:39:30.7823664Z 590ab93c22d2: Verifying Checksum
  2025-12-27T23:39:30.7827425Z 590ab93c22d2: Download complete
  2025-12-27T23:39:30.7844640Z efc2b5ad9eec: Download complete
  2025-12-27T23:39:30.8542935Z bd7e451dfea1: Download complete
  2025-12-27T23:39:30.8545685Z 32b58fa44788: Verifying Checksum
  2025-12-27T23:39:30.8547345Z 32b58fa44788: Download complete
  2025-12-27T23:39:30.9427397Z a4925b5c711a: Verifying Checksum
  2025-12-27T23:39:30.9432336Z a4925b5c711a: Download complete
  2025-12-27T23:39:31.0116541Z cd9459784e3c: Verifying Checksum
  2025-12-27T23:39:31.0118327Z cd9459784e3c: Download complete
  2025-12-27T23:39:31.0872313Z c209e9dadc51: Verifying Checksum
  2025-12-27T23:39:31.0873979Z c209e9dadc51: Download complete
  2025-12-27T23:39:31.4064843Z 26ea96c4c14c: Verifying Checksum
  2025-12-27T23:39:31.4066628Z 26ea96c4c14c: Download complete
  2025-12-27T23:39:32.0833699Z efc2b5ad9eec: Pull complete
  2025-12-27T23:39:33.4823621Z 165b60d1bb48: Pull complete
  2025-12-27T23:39:33.4958518Z 2a328af1ca3a: Pull complete
  2025-12-27T23:39:34.4668824Z 32b58fa44788: Pull complete
  2025-12-27T23:39:34.4802140Z 590ab93c22d2: Pull complete
  2025-12-27T23:39:38.5215942Z 26ea96c4c14c: Pull complete
  2025-12-27T23:39:38.5332561Z bd7e451dfea1: Pull complete
  2025-12-27T23:39:40.5052883Z c209e9dadc51: Pull complete
  2025-12-27T23:39:40.5297792Z a4925b5c711a: Pull complete
  2025-12-27T23:39:40.5421581Z cd9459784e3c: Pull complete
  2025-12-27T23:39:40.5458171Z Digest: sha256:6791ebfd912185ed59bfb5fb102664fa872496b79f87ff8b9cfba292a7345041
  2025-12-27T23:39:40.5472264Z Status: Downloaded newer image for ghcr.io/actions/jekyll-build-pages:v1.0.13
  2025-12-27T23:39:40.5483682Z ghcr.io/actions/jekyll-build-pages:v1.0.13
  2025-12-27T23:39:40.5508454Z ##[endgroup]
  2025-12-27T23:39:40.5787127Z ##[group]Run actions/checkout@v4
  2025-12-27T23:39:40.5787701Z with:
  2025-12-27T23:39:40.5787915Z   ref: freelance-payments
  2025-12-27T23:39:40.5788142Z   submodules: recursive
  2025-12-27T23:39:40.5788365Z   repository: seanivore/freelance-payments
  2025-12-27T23:39:40.5788774Z   token: ***
  2025-12-27T23:39:40.5788959Z   ssh-strict: true
  2025-12-27T23:39:40.5789136Z   ssh-user: git
  2025-12-27T23:39:40.5789335Z   persist-credentials: true
  2025-12-27T23:39:40.5789923Z   clean: true
  2025-12-27T23:39:40.5790132Z   sparse-checkout-cone-mode: true
  2025-12-27T23:39:40.5790356Z   fetch-depth: 1
  2025-12-27T23:39:40.5790540Z   fetch-tags: false
  2025-12-27T23:39:40.5790746Z   show-progress: true
  2025-12-27T23:39:40.5790939Z   lfs: false
  2025-12-27T23:39:40.5791118Z   set-safe-directory: true
  2025-12-27T23:39:40.5791658Z ##[endgroup]
  2025-12-27T23:39:40.6884735Z Syncing repository: seanivore/freelance-payments
  2025-12-27T23:39:40.6886665Z ##[group]Getting Git version info
  2025-12-27T23:39:40.6887533Z Working directory is '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-27T23:39:40.6888616Z [command]/usr/bin/git version
  2025-12-27T23:39:40.6953621Z git version 2.52.0
  2025-12-27T23:39:40.6979760Z ##[endgroup]
  2025-12-27T23:39:40.6994794Z Temporarily overriding HOME='/home/runner/work/_temp/d9d4888e-ead9-4bfc-a08e-4e94b2569703' before making global git config changes
  2025-12-27T23:39:40.6996149Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-27T23:39:40.7008104Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:40.7044783Z Deleting the contents of '/home/runner/work/freelance-payments/freelance-payments'
  2025-12-27T23:39:40.7048249Z ##[group]Initializing the repository
  2025-12-27T23:39:40.7053109Z [command]/usr/bin/git init /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:40.7193770Z hint: Using 'master' as the name for the initial branch. This default branch name
  2025-12-27T23:39:40.7194680Z hint: will change to "main" in Git 3.0. To configure the initial branch name
  2025-12-27T23:39:40.7195241Z hint: to use in all of your new repositories, which will suppress this warning,
  2025-12-27T23:39:40.7195591Z hint: call:
  2025-12-27T23:39:40.7195767Z hint:
  2025-12-27T23:39:40.7196036Z hint: 	git config --global init.defaultBranch <name>
  2025-12-27T23:39:40.7196329Z hint:
  2025-12-27T23:39:40.7196632Z hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and
  2025-12-27T23:39:40.7197502Z hint: 'development'. The just-created branch can be renamed via this command:
  2025-12-27T23:39:40.7198261Z hint:
  2025-12-27T23:39:40.7198473Z hint: 	git branch -m <name>
  2025-12-27T23:39:40.7198687Z hint:
  2025-12-27T23:39:40.7199124Z hint: Disable this message with "git config set advice.defaultBranchName false"
  2025-12-27T23:39:40.7200417Z Initialized empty Git repository in /home/runner/work/freelance-payments/freelance-payments/.git/
  2025-12-27T23:39:40.7210034Z [command]/usr/bin/git remote add origin https://github.com/seanivore/freelance-payments
  2025-12-27T23:39:40.7242128Z ##[endgroup]
  2025-12-27T23:39:40.7242729Z ##[group]Disabling automatic garbage collection
  2025-12-27T23:39:40.7247204Z [command]/usr/bin/git config --local gc.auto 0
  2025-12-27T23:39:40.7274369Z ##[endgroup]
  2025-12-27T23:39:40.7274965Z ##[group]Setting up auth
  2025-12-27T23:39:40.7281949Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-27T23:39:40.7311942Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-27T23:39:40.7663050Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-27T23:39:40.7692237Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-27T23:39:40.7908007Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-27T23:39:40.7938794Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-27T23:39:40.8160160Z [command]/usr/bin/git config --local http.https://github.com/.extraheader AUTHORIZATION: basic ***
  2025-12-27T23:39:40.8192879Z ##[endgroup]
  2025-12-27T23:39:40.8193417Z ##[group]Fetching the repository
  2025-12-27T23:39:40.8201238Z [command]/usr/bin/git -c protocol.version=2 fetch --no-tags --prune --no-recurse-submodules --depth=1 origin +refs/heads/freelance-payments*:refs/remotes/origin/freelance-payments* +refs/tags/freelance-payments*:refs/tags/freelance-payments*
  2025-12-27T23:39:41.0603496Z From https://github.com/seanivore/freelance-payments
  2025-12-27T23:39:41.0604240Z  * [new branch]      freelance-payments -> origin/freelance-payments
  2025-12-27T23:39:41.0636773Z ##[endgroup]
  2025-12-27T23:39:41.0637396Z ##[group]Determining the checkout info
  2025-12-27T23:39:41.0645280Z [command]/usr/bin/git branch --list --remote origin/freelance-payments
  2025-12-27T23:39:41.0669160Z   origin/freelance-payments
  2025-12-27T23:39:41.0674053Z ##[endgroup]
  2025-12-27T23:39:41.0678489Z [command]/usr/bin/git sparse-checkout disable
  2025-12-27T23:39:41.0718143Z [command]/usr/bin/git config --local --unset-all extensions.worktreeConfig
  2025-12-27T23:39:41.0745680Z ##[group]Checking out the ref
  2025-12-27T23:39:41.0753076Z [command]/usr/bin/git checkout --progress --force -B freelance-payments refs/remotes/origin/freelance-payments
  2025-12-27T23:39:41.0966684Z Switched to a new branch 'freelance-payments'
  2025-12-27T23:39:41.0970044Z branch 'freelance-payments' set up to track 'origin/freelance-payments'.
  2025-12-27T23:39:41.0975651Z ##[endgroup]
  2025-12-27T23:39:41.0976313Z ##[group]Setting up auth for fetching submodules
  2025-12-27T23:39:41.0981983Z [command]/usr/bin/git config --global http.https://github.com/.extraheader AUTHORIZATION: basic ***
  2025-12-27T23:39:41.1015611Z [command]/usr/bin/git config --global --unset-all url.https://github.com/.insteadOf
  2025-12-27T23:39:41.1044245Z [command]/usr/bin/git config --global --add url.https://github.com/.insteadOf git@github.com:
  2025-12-27T23:39:41.1073411Z [command]/usr/bin/git config --global --add url.https://github.com/.insteadOf org-54866212@github.com:
  2025-12-27T23:39:41.1098172Z ##[endgroup]
  2025-12-27T23:39:41.1098776Z ##[group]Fetching submodules
  2025-12-27T23:39:41.1103333Z [command]/usr/bin/git submodule sync --recursive
  2025-12-27T23:39:41.1325071Z [command]/usr/bin/git -c protocol.version=2 submodule update --init --force --depth=1 --recursive
  2025-12-27T23:39:41.1601257Z [command]/usr/bin/git submodule foreach --recursive git config --local gc.auto 0
  2025-12-27T23:39:41.1978075Z ##[endgroup]
  2025-12-27T23:39:41.1978495Z ##[group]Persisting credentials for submodules
  2025-12-27T23:39:41.1985906Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'url\.https\:\/\/github\.com\/\.insteadOf' && git config --local --unset-all 'url.https://github.com/.insteadOf' || :"
  2025-12-27T23:39:41.2229167Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local 'http.https://github.com/.extraheader' 'AUTHORIZATION: basic ***' && git config --local --show-origin --name-only --get-regexp remote.origin.url"
  2025-12-27T23:39:41.2448519Z [command]/usr/bin/git submodule foreach --recursive git config --local --add 'url.https://github.com/.insteadOf' 'git@github.com:'
  2025-12-27T23:39:41.2670254Z [command]/usr/bin/git submodule foreach --recursive git config --local --add 'url.https://github.com/.insteadOf' 'org-54866212@github.com:'
  2025-12-27T23:39:41.2881400Z ##[endgroup]
  2025-12-27T23:39:41.2916256Z [command]/usr/bin/git log -1 --format=%H
  2025-12-27T23:39:41.2938917Z a43492045d383f40b3b7b32da7e4f194961f1b72
  2025-12-27T23:39:41.3100116Z ##[group]Run actions/jekyll-build-pages@v1
  2025-12-27T23:39:41.3100412Z with:
  2025-12-27T23:39:41.3100582Z   source: .
  2025-12-27T23:39:41.3100750Z   destination: ./_site
  2025-12-27T23:39:41.3100941Z   future: false
  2025-12-27T23:39:41.3101170Z   build_revision: a43492045d383f40b3b7b32da7e4f194961f1b72
  2025-12-27T23:39:41.3101448Z   verbose: true
  2025-12-27T23:39:41.3101746Z   token: ***
  2025-12-27T23:39:41.3101918Z ##[endgroup]
  2025-12-27T23:39:41.3265839Z ##[command]/usr/bin/docker run --name ghcrioactionsjekyllbuildpagesv1013_a9d6b3 --label a17e81 --workdir /github/workspace --rm -e "INPUT_SOURCE" -e "INPUT_DESTINATION" -e "INPUT_FUTURE" -e "INPUT_BUILD_REVISION" -e "INPUT_VERBOSE" -e "INPUT_TOKEN" -e "HOME" -e "GITHUB_JOB" -e "GITHUB_REF" -e "GITHUB_SHA" -e "GITHUB_REPOSITORY" -e "GITHUB_REPOSITORY_OWNER" -e "GITHUB_REPOSITORY_OWNER_ID" -e "GITHUB_RUN_ID" -e "GITHUB_RUN_NUMBER" -e "GITHUB_RETENTION_DAYS" -e "GITHUB_RUN_ATTEMPT" -e "GITHUB_ACTOR_ID" -e "GITHUB_ACTOR" -e "GITHUB_WORKFLOW" -e "GITHUB_HEAD_REF" -e "GITHUB_BASE_REF" -e "GITHUB_EVENT_NAME" -e "GITHUB_SERVER_URL" -e "GITHUB_API_URL" -e "GITHUB_GRAPHQL_URL" -e "GITHUB_REF_NAME" -e "GITHUB_REF_PROTECTED" -e "GITHUB_REF_TYPE" -e "GITHUB_WORKFLOW_REF" -e "GITHUB_WORKFLOW_SHA" -e "GITHUB_REPOSITORY_ID" -e "GITHUB_TRIGGERING_ACTOR" -e "GITHUB_WORKSPACE" -e "GITHUB_ACTION" -e "GITHUB_EVENT_PATH" -e "GITHUB_ACTION_REPOSITORY" -e "GITHUB_ACTION_REF" -e "GITHUB_PATH" -e "GITHUB_ENV" -e "GITHUB_STEP_SUMMARY" -e "GITHUB_STATE" -e "GITHUB_OUTPUT" -e "RUNNER_OS" -e "RUNNER_ARCH" -e "RUNNER_NAME" -e "RUNNER_ENVIRONMENT" -e "RUNNER_TOOL_CACHE" -e "RUNNER_TEMP" -e "RUNNER_WORKSPACE" -e "ACTIONS_RUNTIME_URL" -e "ACTIONS_RUNTIME_TOKEN" -e "ACTIONS_CACHE_URL" -e "ACTIONS_ID_TOKEN_REQUEST_URL" -e "ACTIONS_ID_TOKEN_REQUEST_TOKEN" -e "ACTIONS_RESULTS_URL" -e GITHUB_ACTIONS=true -e CI=true -v "/var/run/docker.sock":"/var/run/docker.sock" -v "/home/runner/work/_temp":"/github/runner_temp" -v "/home/runner/work/_temp/_github_home":"/github/home" -v "/home/runner/work/_temp/_github_workflow":"/github/workflow" -v "/home/runner/work/_temp/_runner_file_commands":"/github/file_commands" -v "/home/runner/work/freelance-payments/freelance-payments":"/github/workspace" ghcr.io/actions/jekyll-build-pages:v1.0.13
  2025-12-27T23:39:42.2101939Z To use retry middleware with Faraday v2.0+, install `faraday-retry` gem
  2025-12-27T23:39:44.2230471Z   Logging at level: debug
  2025-12-27T23:39:44.2231065Z Configuration file: /github/workspace/./_config.yml
  2025-12-27T23:39:44.2231607Z       GitHub Pages: github-pages v232
  2025-12-27T23:39:44.2232037Z       GitHub Pages: jekyll v3.10.0
  2025-12-27T23:39:44.2232432Z              Theme: jekyll-theme-primer
  2025-12-27T23:39:44.2233267Z       Theme source: /usr/local/bundle/gems/jekyll-theme-primer-0.6.0
  2025-12-27T23:39:44.2233819Z          Requiring: jekyll-github-metadata
  2025-12-27T23:39:44.2234218Z          Requiring: jekyll-seo-tag
  2025-12-27T23:39:44.2234604Z          Requiring: jekyll-coffeescript
  2025-12-27T23:39:44.2235060Z          Requiring: jekyll-commonmark-ghpages
  2025-12-27T23:39:44.2235487Z          Requiring: jekyll-gist
  2025-12-27T23:39:44.2235867Z          Requiring: jekyll-github-metadata
  2025-12-27T23:39:44.2236272Z          Requiring: jekyll-paginate
  2025-12-27T23:39:44.2236674Z          Requiring: jekyll-relative-links
  2025-12-27T23:39:44.2237108Z          Requiring: jekyll-optional-front-matter
  2025-12-27T23:39:44.2237541Z          Requiring: jekyll-readme-index
  2025-12-27T23:39:44.2237946Z          Requiring: jekyll-default-layout
  2025-12-27T23:39:44.2238377Z          Requiring: jekyll-titles-from-headings
  2025-12-27T23:39:44.2238819Z    GitHub Metadata: Initializing...
  2025-12-27T23:39:44.2239207Z             Source: /github/workspace/.
  2025-12-27T23:39:44.2239818Z        Destination: /github/workspace/./_site
  2025-12-27T23:39:44.2240285Z  Incremental build: disabled. Enable with --incremental
  2025-12-27T23:39:44.2240723Z       Generating... 
  2025-12-27T23:39:44.2241317Z        EntryFilter: excluded /CNAME
  2025-12-27T23:39:44.2247642Z         Generating: JekyllOptionalFrontMatter::Generator finished in 0.000948425 seconds.
  2025-12-27T23:39:44.2248304Z         Generating: JekyllReadmeIndex::Generator finished in 6.0964e-05 seconds.
  2025-12-27T23:39:44.2248863Z         Generating: Jekyll::Paginate::Pagination finished in 3.676e-06 seconds.
  2025-12-27T23:39:44.2250008Z         Generating: JekyllRelativeLinks::Generator finished in 0.006372459 seconds.
  2025-12-27T23:39:44.2250684Z         Generating: JekyllDefaultLayout::Generator finished in 0.002387483 seconds.
  2025-12-27T23:39:44.2251283Z          Requiring: kramdown-parser-gfm
  2025-12-27T23:39:44.2251949Z         Generating: JekyllTitlesFromHeadings::Generator finished in 0.010921082 seconds.
  2025-12-27T23:39:44.2252555Z          Rendering: assets/css/style.scss
  2025-12-27T23:39:44.2252958Z   Pre-Render Hooks: assets/css/style.scss
  2025-12-27T23:39:44.2253350Z   Rendering Markup: assets/css/style.scss
  2025-12-27T23:39:44.2253762Z          Rendering: assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.2254210Z   Pre-Render Hooks: assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.2254690Z   Rendering Liquid: assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.2255220Z   Rendering Markup: assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.2255543Z   Rendering Layout: assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.2255976Z      Layout source: theme
  2025-12-27T23:39:44.2256393Z    GitHub Metadata: Generating for seanivore/freelance-payments
  2025-12-27T23:39:44.2257148Z    GitHub Metadata: Calling @client.pages("seanivore/freelance-payments", {})
  2025-12-27T23:39:44.2258266Z    GitHub Metadata: Calling @client.repository("seanivore/freelance-payments", {:accept=>"application/vnd.github.drax-preview+json"})
  2025-12-27T23:39:44.2259261Z          Rendering: assets/docs/CHECKOUT_SESSION_DETAILS.md
  2025-12-27T23:39:44.2260021Z   Pre-Render Hooks: assets/docs/CHECKOUT_SESSION_DETAILS.md
  2025-12-27T23:39:44.2260602Z   Rendering Markup: assets/docs/CHECKOUT_SESSION_DETAILS.md
  2025-12-27T23:39:44.2261180Z   Rendering Layout: assets/docs/CHECKOUT_SESSION_DETAILS.md
  2025-12-27T23:39:44.2261650Z      Layout source: theme
  2025-12-27T23:39:44.2262043Z          Rendering: assets/docs/PLAN_CLARIFICATIONS.md
  2025-12-27T23:39:44.2262554Z   Pre-Render Hooks: assets/docs/PLAN_CLARIFICATIONS.md
  2025-12-27T23:39:44.2263084Z   Rendering Markup: assets/docs/PLAN_CLARIFICATIONS.md
  2025-12-27T23:39:44.2263612Z   Rendering Layout: assets/docs/PLAN_CLARIFICATIONS.md
  2025-12-27T23:39:44.2264076Z      Layout source: theme
  2025-12-27T23:39:44.2264453Z          Rendering: assets/docs/SCHEMA_V3_TESTING.md
  2025-12-27T23:39:44.2264931Z   Pre-Render Hooks: assets/docs/SCHEMA_V3_TESTING.md
  2025-12-27T23:39:44.2265688Z   Rendering Markup: assets/docs/SCHEMA_V3_TESTING.md
  2025-12-27T23:39:44.2266195Z   Rendering Layout: assets/docs/SCHEMA_V3_TESTING.md
  2025-12-27T23:39:44.2266643Z      Layout source: theme
  2025-12-27T23:39:44.2267002Z          Rendering: assets/docs/SYSTEM_REVIEW.md
  2025-12-27T23:39:44.2267472Z   Pre-Render Hooks: assets/docs/SYSTEM_REVIEW.md
  2025-12-27T23:39:44.2267939Z   Rendering Markup: assets/docs/SYSTEM_REVIEW.md
  2025-12-27T23:39:44.2268449Z   Rendering Layout: assets/docs/SYSTEM_REVIEW.md
  2025-12-27T23:39:44.2268871Z      Layout source: theme
  2025-12-27T23:39:44.2269600Z          Rendering: assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-27T23:39:44.2270575Z   Pre-Render Hooks: assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-27T23:39:44.2271571Z   Rendering Markup: assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-27T23:39:44.2272565Z   Rendering Layout: assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-27T23:39:44.2273260Z      Layout source: theme
  2025-12-27T23:39:44.2273836Z          Rendering: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-27T23:39:44.2274947Z   Pre-Render Hooks: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-27T23:39:44.2279624Z   Rendering Markup: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-27T23:39:44.2280569Z   Rendering Layout: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-27T23:39:44.2281213Z      Layout source: theme
  2025-12-27T23:39:44.2281834Z          Rendering: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-27T23:39:44.2282849Z   Pre-Render Hooks: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-27T23:39:44.2283950Z   Rendering Markup: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-27T23:39:44.2285076Z   Rendering Layout: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-27T23:39:44.2285832Z      Layout source: theme
  2025-12-27T23:39:44.2286528Z          Rendering: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-27T23:39:44.2287647Z   Pre-Render Hooks: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-27T23:39:44.2288779Z   Rendering Markup: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-27T23:39:44.2290076Z   Rendering Layout: assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-27T23:39:44.2290852Z      Layout source: theme
  2025-12-27T23:39:44.2291434Z          Rendering: assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-27T23:39:44.2292148Z   Pre-Render Hooks: assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-27T23:39:44.2292797Z   Rendering Markup: assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-27T23:39:44.2293349Z   Rendering Layout: assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-27T23:39:44.2293736Z      Layout source: theme
  2025-12-27T23:39:44.2294123Z          Rendering: assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-27T23:39:44.2294724Z   Pre-Render Hooks: assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-27T23:39:44.2295332Z   Rendering Markup: assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-27T23:39:44.2295959Z   Rendering Layout: assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-27T23:39:44.2296368Z      Layout source: theme
  2025-12-27T23:39:44.2296729Z          Rendering: assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-27T23:39:44.2297502Z   Pre-Render Hooks: assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-27T23:39:44.2298107Z   Rendering Markup: assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-27T23:39:44.2298721Z   Rendering Layout: assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-27T23:39:44.2299132Z      Layout source: theme
  2025-12-27T23:39:44.2299698Z          Rendering: assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-27T23:39:44.2300292Z   Pre-Render Hooks: assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-27T23:39:44.2300894Z   Rendering Markup: assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-27T23:39:44.2301492Z   Rendering Layout: assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-27T23:39:44.2301895Z      Layout source: theme
  2025-12-27T23:39:44.2302157Z            Writing: /github/workspace/_site/assets/css/style.css
  2025-12-27T23:39:44.2302545Z            Writing: /github/workspace/_site/assets/docs/BUG_WORKFLOW_FIX/index.html
  2025-12-27T23:39:44.2303016Z            Writing: /github/workspace/_site/assets/docs/CHECKOUT_SESSION_DETAILS/index.html
  2025-12-27T23:39:44.2303612Z            Writing: /github/workspace/_site/assets/docs/PLAN_CLARIFICATIONS/index.html
  2025-12-27T23:39:44.2304074Z            Writing: /github/workspace/_site/assets/docs/SCHEMA_V3_TESTING/index.html
  2025-12-27T23:39:44.2304508Z            Writing: /github/workspace/_site/assets/docs/SYSTEM_REVIEW/index.html
  2025-12-27T23:39:44.2305086Z            Writing: /github/workspace/_site/assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example/index.html
  2025-12-27T23:39:44.2305808Z            Writing: /github/workspace/_site/assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning/index.html
  2025-12-27T23:39:44.2306551Z            Writing: /github/workspace/_site/assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE/index.html
  2025-12-27T23:39:44.2307356Z            Writing: /github/workspace/_site/assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned/index.html
  2025-12-27T23:39:44.2308125Z            Writing: /github/workspace/_site/assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER/index.html
  2025-12-27T23:39:44.2308865Z            Writing: /github/workspace/_site/assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING/index.html
  2025-12-27T23:39:44.2309834Z            Writing: /github/workspace/_site/assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY/index.html
  2025-12-27T23:39:44.2310950Z            Writing: /github/workspace/_site/assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS/index.html
  2025-12-27T23:39:44.2311880Z                     done in 1.746 seconds.
  2025-12-27T23:39:44.2312202Z  Auto-regeneration: disabled. Use --watch to enable.
  2025-12-27T23:39:44.3086714Z ##[group]Run actions/upload-pages-artifact@v3
  2025-12-27T23:39:44.3087028Z with:
  2025-12-27T23:39:44.3087194Z   path: ./_site
  2025-12-27T23:39:44.3087377Z   name: github-pages
  2025-12-27T23:39:44.3087559Z   retention-days: 1
  2025-12-27T23:39:44.3087738Z ##[endgroup]
  2025-12-27T23:39:44.3183442Z ##[group]Run echo ::group::Archive artifact
  2025-12-27T23:39:44.3183790Z [36;1mecho ::group::Archive artifact[0m
  2025-12-27T23:39:44.3184036Z [36;1mtar \[0m
  2025-12-27T23:39:44.3184252Z [36;1m  --dereference --hard-dereference \[0m
  2025-12-27T23:39:44.3184531Z [36;1m  --directory "$INPUT_PATH" \[0m
  2025-12-27T23:39:44.3184794Z [36;1m  -cvf "$RUNNER_TEMP/artifact.tar" \[0m
  2025-12-27T23:39:44.3185056Z [36;1m  --exclude=.git \[0m
  2025-12-27T23:39:44.3185274Z [36;1m  --exclude=.github \[0m
  2025-12-27T23:39:44.3185483Z [36;1m  .[0m
  2025-12-27T23:39:44.3185662Z [36;1mecho ::endgroup::[0m
  2025-12-27T23:39:44.4104023Z shell: /usr/bin/sh -e {0}
  2025-12-27T23:39:44.4104624Z env:
  2025-12-27T23:39:44.4104908Z   INPUT_PATH: ./_site
  2025-12-27T23:39:44.4105161Z ##[endgroup]
  2025-12-27T23:39:44.4192812Z ##[group]Archive artifact
  2025-12-27T23:39:44.4205625Z ./
  2025-12-27T23:39:44.4205903Z ./api/
  2025-12-27T23:39:44.4206186Z ./api/update-payment.js
  2025-12-27T23:39:44.4206521Z ./api/track-event.js
  2025-12-27T23:39:44.4206834Z ./api/webhook.js
  2025-12-27T23:39:44.4207153Z ./api/create-checkout-session.js
  2025-12-27T23:39:44.4207518Z ./api/sign-contract.js
  2025-12-27T23:39:44.4207828Z ./tailwind.config.js
  2025-12-27T23:39:44.4208111Z ./index.html
  2025-12-27T23:39:44.4208376Z ./assets/
  2025-12-27T23:39:44.4208638Z ./assets/media/
  2025-12-27T23:39:44.4208918Z ./assets/media/thumbnail-image-bauhaus-banking-payments.webp
  2025-12-27T23:39:44.4210744Z ./assets/media/thumbnail-image-sean-august-horvath-freelance-payments.webp
  2025-12-27T23:39:44.4213235Z ./assets/media/banking-profile-icon-photo-bauhaus.png
  2025-12-27T23:39:44.4213835Z ./assets/media/banking-profile-icon-photo-bauhaus.webp
  2025-12-27T23:39:44.4214392Z ./assets/media/profile-picture-horvath.webp
  2025-12-27T23:39:44.4214901Z ./assets/media/thumbnail-image-bauhaus-banking.webp
  2025-12-27T23:39:44.4215855Z ./assets/css/
  2025-12-27T23:39:44.4216147Z ./assets/css/styles.css
  2025-12-27T23:39:44.4216474Z ./assets/css/input.css
  2025-12-27T23:39:44.4216782Z ./assets/css/style.css
  2025-12-27T23:39:44.4217751Z ./assets/favicon/
  2025-12-27T23:39:44.4218066Z ./assets/favicon/site.webmanifest
  2025-12-27T23:39:44.4218456Z ./assets/favicon/favicon-96x96.png
  2025-12-27T23:39:44.4218878Z ./assets/favicon/web-app-manifest-512x512.png
  2025-12-27T23:39:44.4219535Z ./assets/favicon/web-app-manifest-192x192.png
  2025-12-27T23:39:44.4219975Z ./assets/favicon/favicon.svg
  2025-12-27T23:39:44.4220858Z ./assets/favicon/apple-touch-icon.png
  2025-12-27T23:39:44.4221265Z ./assets/favicon/favicon.ico
  2025-12-27T23:39:44.4221597Z ./assets/fonts/
  2025-12-27T23:39:44.4221949Z ./assets/fonts/AgencyFB-RegularCompressed.otf
  2025-12-27T23:39:44.4222444Z ./assets/fonts/AgencyFB-RegularCondensed.otf
  2025-12-27T23:39:44.4222859Z ./assets/docs/
  2025-12-27T23:39:44.4223159Z ./assets/docs/uid-test-004.json
  2025-12-27T23:39:44.4223527Z ./assets/docs/SCHEMA_V3_TESTING/
  2025-12-27T23:39:44.4223921Z ./assets/docs/SCHEMA_V3_TESTING/index.html
  2025-12-27T23:39:44.4224328Z ./assets/docs/SYSTEM_REVIEW/
  2025-12-27T23:39:44.4224696Z ./assets/docs/SYSTEM_REVIEW/index.html
  2025-12-27T23:39:44.4225090Z ./assets/docs/uid-test-007.json
  2025-12-27T23:39:44.4225448Z ./assets/docs/stripe_docs_llm.txt
  2025-12-27T23:39:44.4225803Z ./assets/docs/uid-test-001.json
  2025-12-27T23:39:44.4226169Z ./assets/docs/PLAN_CLARIFICATIONS/
  2025-12-27T23:39:44.4226594Z ./assets/docs/PLAN_CLARIFICATIONS/index.html
  2025-12-27T23:39:44.4227011Z ./assets/docs/uid-test-005.json
  2025-12-27T23:39:44.4227368Z ./assets/docs/uid-test-006.json
  2025-12-27T23:39:44.4227728Z ./assets/docs/PLAN_CLARIFICATIONS.md
  2025-12-27T23:39:44.4228123Z ./assets/docs/BUG_WORKFLOW_FIX/
  2025-12-27T23:39:44.4228646Z ./assets/docs/BUG_WORKFLOW_FIX/index.html
  2025-12-27T23:39:44.4229126Z ./assets/docs/uid-test-003.json
  2025-12-27T23:39:44.4229684Z ./assets/docs/CHECKOUT_SESSION_DETAILS/
  2025-12-27T23:39:44.4230130Z ./assets/docs/CHECKOUT_SESSION_DETAILS/index.html
  2025-12-27T23:39:44.4230586Z ./assets/docs/SCHEMA_V3_TESTING.md
  2025-12-27T23:39:44.4230953Z ./assets/docs/uid-test-008.json
  2025-12-27T23:39:44.4231308Z ./assets/docs/SYSTEM_REVIEW.md
  2025-12-27T23:39:44.4231670Z ./assets/docs/uid-test-002.json
  2025-12-27T23:39:44.4232022Z ./assets/docs/BUG_WORKFLOW_FIX.md
  2025-12-27T23:39:44.4232419Z ./assets/docs/CHECKOUT_SESSION_DETAILS.md
  2025-12-27T23:39:44.4232828Z ./assets/docs/planning-resources/
  2025-12-27T23:39:44.4233304Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/
  2025-12-27T23:39:44.4234050Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned/
  2025-12-27T23:39:44.4235046Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned/index.html
  2025-12-27T23:39:44.4236154Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning/
  2025-12-27T23:39:44.4236940Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning/index.html
  2025-12-27T23:39:44.4237742Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/dev_planning.md
  2025-12-27T23:39:44.4238579Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/project_scope_summary_cleaned.md
  2025-12-27T23:39:44.4239635Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE.md
  2025-12-27T23:39:44.4240394Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE/
  2025-12-27T23:39:44.4240950Z ./assets/docs/planning-resources/ORIGINAL_PLANNING_DOCS/draft_long_PROJECT_SCOPE/index.html
  2025-12-27T23:39:44.4241462Z ./assets/docs/planning-resources/W_I_P/
  2025-12-27T23:39:44.4242010Z ./assets/docs/planning-resources/W_I_P/test-already-signed.json
  2025-12-27T23:39:44.4242524Z ./assets/docs/planning-resources/W_I_P/test-four-payments.json
  2025-12-27T23:39:44.4243039Z ./assets/docs/planning-resources/W_I_P/test-partially-paid.json
  2025-12-27T23:39:44.4243741Z ./assets/docs/planning-resources/W_I_P/test-single-payment-v2.json
  2025-12-27T23:39:44.4244416Z ./assets/docs/planning-resources/W_I_P/test-special-chars.json
  2025-12-27T23:39:44.4244934Z ./assets/docs/planning-resources/W_I_P/test-all-paid.json
  2025-12-27T23:39:44.4245298Z ./assets/docs/planning-resources/W_I_P/test-multi-payment.json
  2025-12-27T23:39:44.4245692Z ./assets/docs/planning-resources/W_I_P/test-long-description.json
  2025-12-27T23:39:44.4246123Z ./assets/docs/planning-resources/W_I_P/test-single-payment.json
  2025-12-27T23:39:44.4246694Z ./assets/docs/planning-resources/reports/
  2025-12-27T23:39:44.4247173Z ./assets/docs/planning-resources/reports/prices.csv
  2025-12-27T23:39:44.4247710Z ./assets/docs/planning-resources/reports/products.csv
  2025-12-27T23:39:44.4248283Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/
  2025-12-27T23:39:44.4249040Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-1.jpg
  2025-12-27T23:39:44.4250186Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/portfolio-aesthetic-example.jpg
  2025-12-27T23:39:44.4251192Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-2.jpg
  2025-12-27T23:39:44.4252201Z ./assets/docs/planning-resources/IMAGE_VISUAL_DESIGN_GUIDE/example-homepage-glow-mouse-3.jpg
  2025-12-27T23:39:44.4252952Z ./assets/docs/planning-resources/EXAMPLE_FILES/
  2025-12-27T23:39:44.4253606Z ./assets/docs/planning-resources/EXAMPLE_FILES/generate_manifest_example.py
  2025-12-27T23:39:44.4254235Z ./assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example.md
  2025-12-27T23:39:44.4254928Z ./assets/docs/planning-resources/EXAMPLE_FILES/entry-controller_example.js
  2025-12-27T23:39:44.4255713Z ./assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example/
  2025-12-27T23:39:44.4256537Z ./assets/docs/planning-resources/EXAMPLE_FILES/AI_CONTEXT_PRIMER_example/index.html
  2025-12-27T23:39:44.4257531Z ./assets/docs/planning-resources/EXAMPLE_FILES/manifest_example.yml
  2025-12-27T23:39:44.4258229Z ./assets/docs/planning-resources/EXAMPLE_FILES/styles_example.css
  2025-12-27T23:39:44.4258895Z ./assets/docs/planning-resources/EXAMPLE_FILES/404_example.html
  2025-12-27T23:39:44.4259720Z ./assets/docs/planning-resources/EXAMPLE_FILES/data-loader_example.js
  2025-12-27T23:39:44.4260367Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/
  2025-12-27T23:39:44.4261088Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY.md
  2025-12-27T23:39:44.4261933Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER/
  2025-12-27T23:39:44.4262667Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER/index.html
  2025-12-27T23:39:44.4263192Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING.md
  2025-12-27T23:39:44.4263672Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/AI_CONTEXT_PRIMER.md
  2025-12-27T23:39:44.4264534Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING/
  2025-12-27T23:39:44.4265717Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/MODULAR_REFACTOR_PLANNING/index.html
  2025-12-27T23:39:44.4266308Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY/
  2025-12-27T23:39:44.4266835Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/SCHEMA_MIGRATION_RECOVERY/index.html
  2025-12-27T23:39:44.4267376Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS.md
  2025-12-27T23:39:44.4267877Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS/
  2025-12-27T23:39:44.4268425Z ./assets/docs/planning-resources/PREVIOUS_REFACTORING/TESTING_DEBUGGING_STATUS/index.html
  2025-12-27T23:39:44.4268818Z ./assets/templates/
  2025-12-27T23:39:44.4269032Z ./assets/templates/invoice-template.html
  2025-12-27T23:39:44.4269293Z ./assets/templates/contract-template.html
  2025-12-27T23:39:44.4269762Z ./assets/js/
  2025-12-27T23:39:44.4269942Z ./assets/js/manifest.json
  2025-12-27T23:39:44.4270162Z ./assets/js/contract-controller.js
  2025-12-27T23:39:44.4270400Z ./assets/js/payment-lookup.js
  2025-12-27T23:39:44.4270615Z ./assets/js/components/
  2025-12-27T23:39:44.4270818Z ./assets/js/components/button.js
  2025-12-27T23:39:44.4271036Z ./assets/js/components/card.js
  2025-12-27T23:39:44.4271256Z ./assets/js/components/input.js
  2025-12-27T23:39:44.4271476Z ./assets/js/payment-router.js
  2025-12-27T23:39:44.4271702Z ./assets/js/checkout-controller.js
  2025-12-27T23:39:44.4271930Z ./assets/js/invoice-controller.js
  2025-12-27T23:39:44.4272156Z ./package-lock.json
  2025-12-27T23:39:44.4272327Z ./job.html
  2025-12-27T23:39:44.4272489Z ./package.json
  2025-12-27T23:39:44.4272655Z ./404.html
  2025-12-27T23:39:44.4272819Z ./postcss.config.js
  2025-12-27T23:39:44.4272988Z ./vercel.json
  2025-12-27T23:39:44.4273336Z ##[endgroup]
  2025-12-27T23:39:44.4339192Z ##[group]Run actions/upload-artifact@v4
  2025-12-27T23:39:44.4339645Z with:
  2025-12-27T23:39:44.4339833Z   name: github-pages
  2025-12-27T23:39:44.4340063Z   path: /home/runner/work/_temp/artifact.tar
  2025-12-27T23:39:44.4340318Z   retention-days: 1
  2025-12-27T23:39:44.4340513Z   if-no-files-found: error
  2025-12-27T23:39:44.4340723Z   compression-level: 6
  2025-12-27T23:39:44.4340905Z   overwrite: false
  2025-12-27T23:39:44.4341094Z   include-hidden-files: false
  2025-12-27T23:39:44.4341299Z ##[endgroup]
  2025-12-27T23:39:44.6461002Z With the provided path, there will be 1 file uploaded
  2025-12-27T23:39:44.6465792Z Artifact name is valid!
  2025-12-27T23:39:44.6467516Z Root directory input is valid!
  2025-12-27T23:39:44.7284932Z Beginning upload of artifact content to blob storage
  2025-12-27T23:39:44.9333216Z Uploaded bytes 1517819
  2025-12-27T23:39:44.9465748Z Finished uploading artifact content to blob storage!
  2025-12-27T23:39:44.9469270Z SHA256 digest of uploaded artifact zip is a5a20eb054759e354fbc12bf5eb2d18f2f6c43e500f9b3e469260ab59603ea7f
  2025-12-27T23:39:44.9471617Z Finalizing artifact upload
  2025-12-27T23:39:45.0207496Z Artifact github-pages.zip successfully finalized. Artifact ID 4976639555
  2025-12-27T23:39:45.0208621Z Artifact github-pages has been successfully uploaded! Final size is 1517819 bytes. Artifact ID is 4976639555
  2025-12-27T23:39:45.0215724Z Artifact download URL: https://github.com/seanivore/freelance-payments/actions/runs/20545892311/artifacts/4976639555
  2025-12-27T23:39:45.0388926Z Post job cleanup.
  2025-12-27T23:39:45.1323026Z [command]/usr/bin/git version
  2025-12-27T23:39:45.1359838Z git version 2.52.0
  2025-12-27T23:39:45.1403315Z Temporarily overriding HOME='/home/runner/work/_temp/14c8cca6-f9a6-479a-9604-08b59a3e6532' before making global git config changes
  2025-12-27T23:39:45.1404551Z Adding repository directory to the temporary git global config as a safe directory
  2025-12-27T23:39:45.1409881Z [command]/usr/bin/git config --global --add safe.directory /home/runner/work/freelance-payments/freelance-payments
  2025-12-27T23:39:45.1444627Z [command]/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
  2025-12-27T23:39:45.1476765Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
  2025-12-27T23:39:45.1699164Z [command]/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
  2025-12-27T23:39:45.1719919Z http.https://github.com/.extraheader
  2025-12-27T23:39:45.1731947Z [command]/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
  2025-12-27T23:39:45.1761391Z [command]/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
  2025-12-27T23:39:45.1978924Z [command]/usr/bin/git config --local --name-only --get-regexp ^includeIf\.gitdir:
  2025-12-27T23:39:45.2008487Z [command]/usr/bin/git submodule foreach --recursive git config --local --show-origin --name-only --get-regexp remote.origin.url
  2025-12-27T23:39:45.2346555Z Cleaning up orphan processes

  2. report-build-status 

  2025-12-27T23:39:49.1124529Z Current runner version: '2.330.0'
  2025-12-27T23:39:49.1149694Z ##[group]Runner Image Provisioner
  2025-12-27T23:39:49.1150449Z Hosted Compute Agent
  2025-12-27T23:39:49.1151049Z Version: 20251211.462
  2025-12-27T23:39:49.1151667Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-27T23:39:49.1152297Z Build Date: 2025-12-11T16:28:49Z
  2025-12-27T23:39:49.1153354Z Worker ID: {28cf5a82-b7bb-46c2-9c1a-ade93eaf2a66}
  2025-12-27T23:39:49.1154058Z ##[endgroup]
  2025-12-27T23:39:49.1154567Z ##[group]Operating System
  2025-12-27T23:39:49.1155201Z Ubuntu
  2025-12-27T23:39:49.1155638Z 24.04.3
  2025-12-27T23:39:49.1156112Z LTS
  2025-12-27T23:39:49.1156598Z ##[endgroup]
  2025-12-27T23:39:49.1157138Z ##[group]Runner Image
  2025-12-27T23:39:49.1157640Z Image: ubuntu-24.04
  2025-12-27T23:39:49.1158467Z Version: 20251215.174.1
  2025-12-27T23:39:49.1159479Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-27T23:39:49.1161115Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-27T23:39:49.1162121Z ##[endgroup]
  2025-12-27T23:39:49.1163183Z ##[group]GITHUB_TOKEN Permissions
  2025-12-27T23:39:49.1165289Z Contents: read
  2025-12-27T23:39:49.1165802Z Metadata: read
  2025-12-27T23:39:49.1166394Z Pages: write
  2025-12-27T23:39:49.1166857Z ##[endgroup]
  2025-12-27T23:39:49.1169322Z Secret source: Actions
  2025-12-27T23:39:49.1170410Z Prepare workflow directory
  2025-12-27T23:39:49.1485517Z Prepare all required actions
  2025-12-27T23:39:49.1577644Z Complete job name: report-build-status
  2025-12-27T23:39:49.7056042Z ##[group]Run gh api -X POST "repos/$GITHUB_REPOSITORY/pages/telemetry" \
  2025-12-27T23:39:49.7057141Z [36;1mgh api -X POST "repos/$GITHUB_REPOSITORY/pages/telemetry" \[0m
  2025-12-27T23:39:49.7058367Z [36;1m  -F github_run_id="$GITHUB_RUN_ID" \[0m
  2025-12-27T23:39:49.7059242Z [36;1m  -F conclusion="$CONCLUSION"[0m
  2025-12-27T23:39:49.7484569Z shell: /usr/bin/bash -e {0}
  2025-12-27T23:39:49.7485578Z env:
  2025-12-27T23:39:49.7486375Z   GITHUB_TOKEN: ***
  2025-12-27T23:39:49.7487012Z   CONCLUSION: success
  2025-12-27T23:39:49.7487559Z ##[endgroup]
  2025-12-27T23:39:50.1168470Z {}
  2025-12-27T23:39:50.1315418Z Cleaning up orphan processes

  3. deploy 

  2025-12-27T23:39:51.1731643Z Current runner version: '2.330.0'
  2025-12-27T23:39:51.1754085Z ##[group]Runner Image Provisioner
  2025-12-27T23:39:51.1754850Z Hosted Compute Agent
  2025-12-27T23:39:51.1755473Z Version: 20251211.462
  2025-12-27T23:39:51.1756040Z Commit: 6cbad8c2bb55d58165063d031ccabf57e2d2db61
  2025-12-27T23:39:51.1756731Z Build Date: 2025-12-11T16:28:49Z
  2025-12-27T23:39:51.1757459Z Worker ID: {5bef373b-0917-47e4-a4f3-e5877c031583}
  2025-12-27T23:39:51.1758131Z ##[endgroup]
  2025-12-27T23:39:51.1758651Z ##[group]Operating System
  2025-12-27T23:39:51.1759215Z Ubuntu
  2025-12-27T23:39:51.1759690Z 24.04.3
  2025-12-27T23:39:51.1760099Z LTS
  2025-12-27T23:39:51.1760570Z ##[endgroup]
  2025-12-27T23:39:51.1761058Z ##[group]Runner Image
  2025-12-27T23:39:51.1761585Z Image: ubuntu-24.04
  2025-12-27T23:39:51.1762018Z Version: 20251215.174.1
  2025-12-27T23:39:51.1763328Z Included Software: https://github.com/actions/runner-images/blob/ubuntu24/20251215.174/images/ubuntu/Ubuntu2404-Readme.md
  2025-12-27T23:39:51.1764876Z Image Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F20251215.174
  2025-12-27T23:39:51.1765945Z ##[endgroup]
  2025-12-27T23:39:51.1766970Z ##[group]GITHUB_TOKEN Permissions
  2025-12-27T23:39:51.1768749Z Contents: read
  2025-12-27T23:39:51.1769252Z Metadata: read
  2025-12-27T23:39:51.1769723Z Pages: write
  2025-12-27T23:39:51.1770304Z ##[endgroup]
  2025-12-27T23:39:51.1772199Z Secret source: Actions
  2025-12-27T23:39:51.1773078Z Prepare workflow directory
  2025-12-27T23:39:51.2090295Z Prepare all required actions
  2025-12-27T23:39:51.2126777Z Getting action download info
  2025-12-27T23:39:51.6087101Z Download action repository 'actions/deploy-pages@v4' (SHA:d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e)
  2025-12-27T23:39:52.3671627Z Complete job name: deploy
  2025-12-27T23:39:52.4398313Z ##[group]Run actions/deploy-pages@v4
  2025-12-27T23:39:52.4399166Z with:
  2025-12-27T23:39:52.4399689Z   token: ***
  2025-12-27T23:39:52.4400052Z   timeout: 600000
  2025-12-27T23:39:52.4400422Z   error_count: 10
  2025-12-27T23:39:52.4400796Z   reporting_interval: 5000
  2025-12-27T23:39:52.4401259Z   artifact_name: github-pages
  2025-12-27T23:39:52.4401700Z   preview: false
  2025-12-27T23:39:52.4402587Z ##[endgroup]
  2025-12-27T23:39:52.9221584Z Fetching artifact metadata for "github-pages" in this workflow run
  2025-12-27T23:39:53.1987466Z Found 1 artifact(s)
  2025-12-27T23:39:53.2001992Z Creating Pages deployment with payload:
  2025-12-27T23:39:53.2002981Z {
  2025-12-27T23:39:53.2003590Z 	"artifact_id": 4976639555,
  2025-12-27T23:39:53.2004378Z 	"pages_build_version": "a43492045d383f40b3b7b32da7e4f194961f1b72",
  2025-12-27T23:39:53.2071368Z 	"oidc_token": "***"
  2025-12-27T23:39:53.2072019Z }
  2025-12-27T23:39:53.5588687Z Created deployment for a43492045d383f40b3b7b32da7e4f194961f1b72, ID: a43492045d383f40b3b7b32da7e4f194961f1b72
  2025-12-27T23:39:58.5608025Z Getting Pages deployment status...
  2025-12-27T23:39:58.7720944Z Reported success!
  2025-12-27T23:39:58.7956281Z Evaluate and set environment url
  2025-12-27T23:39:58.7960752Z Evaluated environment url: https://payments.august.style/
  2025-12-27T23:39:58.7961692Z Cleaning up orphan processes