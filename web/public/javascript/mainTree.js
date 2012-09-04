'use strict';

module.exports = function (gitRepo) {
  return new MainTree(gitRepo);
};

function MainTree(gitRepo) {
  this.gitRepo = gitRepo;
  this.tree = $('#mainTree').jstree({
    plugins: ["themes", "json_data", "ui", "types", "contextmenu"],
    themes: {
      dots: false,
      url: '/css/jstree/default/style.css'
    },
    json_data: {
      data: this.getTreeData.bind(this)
    },
    contextmenu: {
      items: this.onMainTreeContextMenu.bind(this)
    },
    types: {
      types: {
        "ref": {
          icon: {
            image: '/image/ref-head.png'
          }
        },
        "tag": {
          icon: {
            image: '/image/ref-tag.png'
          }
        },
        "stash": {
          icon: {
            image: '/image/ref-stash.png'
          }
        }
      }
    }
  });

  this.jstree = jQuery.jstree._reference(this.tree);
}

MainTree.prototype.refresh = function (callback) {
  callback = callback || function () {};
  this.jstree.refresh(-1);
  return callback(); // TODO: wait for refresh
};

MainTree.prototype.getTreeData = function (node, callback) {
  if (node === -1) {
    return this.loadRoot(node, callback);
  }

  var id = node.attr('id');
  if (id === 'mainTreeBranches') {
    return this.loadBranches(node, callback);
  }

  if (id === 'mainTreeTags') {
    return this.loadTags(node, callback);
  }

  if (id === 'mainTreeStashes') {
    return this.loadStashes(node, callback);
  }

  console.log('unhandled tree node', node.attr('id'));
};

MainTree.prototype.loadRoot = function (node, callback) {
  var self = this;
  setTimeout(function () {
    self.jstree.open_node($('#mainTreeBranches'), null, true);
    self.jstree.open_node($('#mainTreeTags'), null, true);
    self.jstree.open_node($('#mainTreeStashes'), null, true);
  }, 500);
  return callback([
    {
      attr: { id: "mainTreeBranches" },
      data: "Branches",
      state: "closed"
    },
    {
      attr: { id: "mainTreeTags" },
      data: "Tags",
      state: "closed"
    },
    {
      attr: { id: "mainTreeStashes" },
      data: "Stashes",
      state: "closed"
    }
  ]);
};

MainTree.prototype.loadBranches = function (node, callback) {
  var self = this;
  this.gitRepo.getBranches(function (err, branches) {
    if (err) {
      return showError(err);
    }
    var branchNodes = branches.map(toTreeNode);
    return callback(branchNodes)
  });

  function toTreeNode(branch) {
    return {
      attr: {
        id: "mainTreeBranch_" + branch.name,
        class: branch.current ? 'branch branch-current' : 'branch',
        rel: 'ref'
      },
      data: branch.name
    };
  }
};

MainTree.prototype.loadTags = function (node, callback) {
  var self = this;
  this.gitRepo.getTags(function (err, tags) {
    if (err) {
      return showError(err);
    }
    var tagNodes = tags.map(toTreeNode);
    return callback(tagNodes)
  });

  function toTreeNode(tag) {
    return {
      attr: {
        id: "mainTreeTag_" + tag.name,
        rel: 'tag'
      },
      data: tag.name
    };
  }
};

MainTree.prototype.loadStashes = function (node, callback) {
  var self = this;
  this.gitRepo.getStashes(function (err, stashes) {
    if (err) {
      return showError(err);
    }
    var stashNodes = stashes.map(toTreeNode);
    return callback(stashNodes)
  });

  function toTreeNode(stash) {
    return {
      attr: {
        id: "mainTreeStash_" + stash.id,
        rel: 'stash'
      },
      data: stash.message
    };
  }
};

MainTree.prototype.onMainTreeContextMenu = function (node) {
  var nodeId = $(node).attr('id');
  console.log('tree node context menu:', nodeId);
};