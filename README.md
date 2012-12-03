gitgui
======

A great GUI tool for git.

## Installation

I'm working on making this process easier. But for now here is what needs to be done:

```bash
$ sudo npm install gitgui -g
$ cd /usr/local/lib/node_modules/gitgui
$ sudo npm install appjs
$ sudo vi usr/local/bin/gitgui

   #!/bin/bash

   DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

   cd $DIR/../lib/node_modules/gitgui
   node --harmony ./bin/app.js $1 $2 $3 $4 $5 $6 $7 $8 $9

```

## Usage

```bash
$ gitgui /path/to/your/repo
```

![ScreenShot](http://joeferner.github.com/node-gitgui/images/snapshot1.png)
