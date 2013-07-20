'use strict';

// This file implements encoding system documented by libtabe,
// inspired by the ETen Chinese System.
// See ./libtabe/doc/BoPoMoFo.shtml
// Get libtabe at http://sourceforge.net/projects/libtabe/

//               1st Group  2nd Group  3rd Group  Tone Symbols
// # of Symbols  21         3          13         5
// # of Bits     6          2          4          3

// TODO: Maybe support Extended Bopomofo in the future?

var BopomofoEncoder = {
  // Unicode range of each of the Bopomofo symbol groups
  // See https://en.wikipedia.org/wiki/Bopomofo_(script)#Unicode
  BOPOMOFO_START_GROUP_1: 0x3105,
  BOPOMOFO_END_GROUP_1: 0x3119,
  BOPOMOFO_START_GROUP_2: 0x3127,
  BOPOMOFO_END_GROUP_2: 0x3129,
  BOPOMOFO_START_GROUP_3: 0x311A,
  BOPOMOFO_END_GROUP_3: 0x3126,

  // Number substract or add the pad value when transforming symbols into bits
  BOPOMOFO_GROUP_1_PAD: 0x3104,
  BOPOMOFO_GROUP_2_PAD: 0x3126,
  BOPOMOFO_GROUP_3_PAD: 0x3119,

  // Tone symbols are placed in Spacing Modifier Letters Unicode block
  BOPOMOFO_TONE_1: 0x0020,
  BOPOMOFO_TONE_2: 0x02ca,
  BOPOMOFO_TONE_3: 0x02c7,
  BOPOMOFO_TONE_4: 0x02cb,
  BOPOMOFO_TONE_5: 0x02c9,

  /**
   * Encode a string containing syllables spelled by Bopomofo symbols
   * into encoded string.
   * @param  {string} syllablesStr Syllable string.
   * @return {string}              encoded string.
   * @this   BopomofoEncoder
   */
  encode: function be_encode(syllablesStr) {
    var encodedStr = '';

    var symbolsCode = 0;
    var filled_1 = false;
    var filled_2 = false;
    var filled_3 = false;
    var filled_4 = false;

    var next = function next() {
      encodedStr += String.fromCharCode(symbolsCode);

      symbolsCode = 0;
      filled_1 = filled_2 = filled_3 = filled_4 = false;
    };

    for (var j = 0; j < syllablesStr.length; j++) {
      var symbolCode = syllablesStr.charCodeAt(j);

      if (symbolCode >= this.BOPOMOFO_START_GROUP_1 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_1) {
        if (filled_1 || filled_2 || filled_3 || filled_4)
          next();

        filled_1 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_1_PAD) << 9;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_2 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_2) {
        if (filled_2 || filled_4)
          next();

        filled_2 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_2_PAD) << 7;
        continue;
      }

      if (symbolCode >= this.BOPOMOFO_START_GROUP_3 &&
          symbolCode <= this.BOPOMOFO_END_GROUP_3) {
        if (filled_3 || filled_4)
          next();

        filled_3 = true;

        symbolsCode |= (symbolCode - this.BOPOMOFO_GROUP_3_PAD) << 3;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_1) {
        if (filled_4)
          next();

        filled_4 = true;
        symbolsCode |= 0x1;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_2) {
        if (filled_4)
          next();

        filled_4 = true;
        symbolsCode |= 0x2;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_3) {
        if (filled_4)
          next();

        filled_4 = true;
        symbolsCode |= 0x3;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_4) {
        if (filled_4)
          next();

        filled_4 = true;
        symbolsCode |= 0x4;
        continue;
      }

      if (symbolCode == this.BOPOMOFO_TONE_5) {
        if (filled_4)
          next();

        filled_4 = true;
        symbolsCode |= 0x5;
        continue;
      }

      throw 'Unknown symbol at position ' + j + ': ' + syllablesStr[j];
    }

    next();
    return encodedStr;
  },

  /**
   * Decode an encoded string into syllables string.
   * @param  {string} encodedStr encoded string.
   * @return {string}            syllables string.
   * @this   BopomofoEncoder
   */
  decode: function be_decode(encodedStr) {
    var syllablesStr = '';
    for (var i = 0; i < encodedStr.length; i++) {
      var symbolsCode = encodedStr.charCodeAt(i);
      var group_1_code = (symbolsCode & 0x7e00) >> 9;
      var group_2_code = (symbolsCode & 0x0180) >> 7;
      var group_3_code = (symbolsCode & 0x0078) >> 3;
      var toneCode = symbolsCode & 0x0007;

      if (group_1_code) {
        syllablesStr +=
          String.fromCharCode(this.BOPOMOFO_GROUP_1_PAD + group_1_code);
      }

      if (group_2_code) {
        syllablesStr +=
          String.fromCharCode(this.BOPOMOFO_GROUP_2_PAD + group_2_code);
      }

      if (group_3_code) {
        syllablesStr +=
          String.fromCharCode(this.BOPOMOFO_GROUP_3_PAD + group_3_code);
      }

      switch (toneCode) {
        case 1:
          syllablesStr += String.fromCharCode(this.BOPOMOFO_TONE_1);
          break;

        case 2:
          syllablesStr += String.fromCharCode(this.BOPOMOFO_TONE_2);
          break;

        case 3:
          syllablesStr += String.fromCharCode(this.BOPOMOFO_TONE_3);
          break;

        case 4:
          syllablesStr += String.fromCharCode(this.BOPOMOFO_TONE_4);
          break;

        case 5:
          syllablesStr += String.fromCharCode(this.BOPOMOFO_TONE_5);
          break;
      }
    }

    return syllablesStr;
  }
};

// Export as a CommonJS module if we are loaded as one.
if (typeof module === 'object' && module['exports']) {
  module['exports'] = BopomofoEncoder;
}