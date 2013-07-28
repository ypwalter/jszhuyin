'use strict';


module('CacheStore');

test('add()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.data['Key1'], ['value1', 'value2'], 'Passed!');
});

test('get()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
});

test('cleanup()', function() {
  var store = new CacheStore();
  store.add('Key1', ['value1', 'value2']);
  store.add('Key2', ['value3', 'value4']);
  store.add('Key3', ['value5', 'value6']);

  store.cleanup('Key1Key3');

  deepEqual(store.get('Key1'), ['value1', 'value2'], 'Passed!');
  deepEqual(store.get('Key2'), undefined, 'Passed!');
  deepEqual(store.get('Key3'), ['value5', 'value6'], 'Passed!');
});

module('ActionQueue');

test('queue()', function() {
  var queue = new ActionQueue();
  queue.handle = function(a, b, c) {
    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');
    queue.done();
  };
  queue.queue('a', 'b', 'c');
});

test('queue() two actions.', function() {
  var queue = new ActionQueue();
  expect(6);
  queue.handle = function(a, b, c) {
    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');
    queue.done();
  };
  queue.queue('a', 'b', 'c');
  queue.queue('a', 'b', 'c');
});

test('queue() 3 async actions.', function() {
  var queue = new ActionQueue();
  expect(9);
  queue.handle = function(a, b, c) {
    queue.handle = function(c, d, e) {
      queue.handle = function(f, g, i) {
        equal(f, 'f', 'Passed!');
        equal(g, 'g', 'Passed!');
        equal(i, 'i', 'Passed!');

        setTimeout(function() {
          queue.done();
          start();
        });
      };
      equal(c, 'c', 'Passed!');
      equal(d, 'd', 'Passed!');
      equal(e, 'e', 'Passed!');

      queue.queue('f', 'g', 'i');

      setTimeout(function() {
        queue.done();
      });
    };

    equal(a, 'a', 'Passed!');
    equal(b, 'b', 'Passed!');
    equal(c, 'c', 'Passed!');

    setTimeout(function() {
      queue.done();
    });
  };
  stop();
  queue.queue('a', 'b', 'c');
  queue.queue('c', 'd', 'e');
});

module('JSZhuyinIME', {
  teardown: function() {
    var IDB = IndexedDBStorage.prototype.IDB;
    var req = IDB.deleteDatabase('TestDatabase');
    req.onerror = function() {
      throw 'Teardown error';
    };
  }
});

test('create instance', function() {
  var ime = new JSZhuyinIME();
  ok(true, 'Passed!');
});

test('load()', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ok(true, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load();
});

test('load() non-exist files', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['404.json'];
  expect(2);
  ime.onerror = function() {
    ok(true, 'Passed!');
  };
  ime.onloadend = function() {
    ok(true, 'Passed!');
    ime.unload();

    start();
  };

  stop();
  ime.load();
});


test('query() a word', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() the same word twice', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊ';
    expect(4);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.cache.cleanup = function mockCleanup(supersetKey) {
      equal(supersetKey,
        BopomofoEncoder.encode('ㄊㄞˊ'), 'Passed!');
    };
    ime.queue.done = function() {
      var originalGet = ime.storage.get;
      ime.storage.get = function mockGet() {
        ok(false, 'storage.get() was called twice.');

        originalGet.apply(this, arguments);
      };
      ime.queue.done = function() {
        ime.unload();
        start();
      };
      ime.query();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() a two-word phrase', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["台北",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() a three-word phrase', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇㄕˋ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["台北市",3],["臺北市",3],["台北是",3],
         ["台北",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() two words which don\'t made up a phrase', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄅㄟˇㄕˋ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["北是",2],["北",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() non-exist word', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄅㄟˊ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["ㄅㄟˊ",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('query() non-exist phrase', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˊ';
    expect(1);
    ime.updateSelections = function(results) {
      deepEqual(results,
        [["台ㄅㄟˊ",2],
         ["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
         ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
         ["儓",1],["駘",1],["籉",1]],
        'Passed!');
    };
    ime.queue.done = function() {
      ime.unload();

      start();
    };
    ime.query();
  };

  stop();
  ime.load();
});

test('updateComposition()', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(1);
  ime.oncompositionupdate = function(composition) {
    equal(composition, 'ㄊㄞˊㄅㄟˇ', 'Passed!');
    ime.unload();
    start();
  }
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    ime.updateComposition();
  };

  stop();
  ime.load();
});

test('updateSelections()', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(2);
  ime.oncandidateupdate = function(results) {
    deepEqual(results,
      [["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
       ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
       ["儓",1],["駘",1],["籉",1]],
      'Passed!');
    deepEqual(ime.defaultCandidate, ["台",1], 'Passed!');

    ime.unload();
    start();
  }
  ime.onloadend = function() {
    ime.updateSelections([["台",1],["臺",1],["抬",1],["颱",1],["檯",1],["苔",1],["跆",1],
     ["邰",1],["鮐",1],["薹",1],["嬯",1],["秮",1],["旲",1],["炱",1],
     ["儓",1],["駘",1],["籉",1]]);
  };

  stop();
  ime.load();
});

test('confirmSelection()', function() {
  var ime = new JSZhuyinIME();
  ime.IDB_NAME = 'TestDatabase';
  ime.IDB_VERSION = 1;
  ime.JSON_URL = './resources/';
  ime.JSON_FILES = ['testdata.json'];
  expect(3);
  ime.oncompositionend = function(string) {
    equal(string, '台', 'Passed!');
  };
  ime.oncompositionupdate = function(composition) {
    equal(composition, 'ㄅㄟˇ', 'Passed!');
  };
  ime.query = function() {
    ok(true, 'Passed!');
    ime.unload();
    start();
  };
  ime.onloadend = function() {
    ime.syllables = 'ㄊㄞˊㄅㄟˇ';
    ime.confirmSelection(["台",1]);
  };

  stop();
  ime.load();
});