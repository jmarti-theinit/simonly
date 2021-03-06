/* eslint-disable no-console */
import { sequenceArrayPromises } from '../lib/promises';
import timeoutUtil from '../lib/timeoutUtil';

const DEFAULT_TIME_PER_KEY = 800;

export default class SimonlyLocalUI {

  constructor(timePerKey) {
    this.pressedKey = null;
    this.theRightKey = null;
    this.score = 0;
    this.id = Math.round(Math.random() * 100000);
    this.timePerKey = timePerKey || DEFAULT_TIME_PER_KEY;
    this.roundOkAudio = null;
    this.roundKoAudio = null;
    this.blockKeys = false;
    /* setInterval(() => {
      if (this.roundOkAudio) {
        console.log('this.roundOkAudio.src', this.roundOkAudio);
      }
    }, 500); */
  }

  /* *** interface to be implemented by simonlyGamePresenter ***** */
  showSequence(keys) {
    this.blockKeys = true;
    this.theRightKey = null;
    const sequencePress = sequenceArrayPromises(this.showKey.bind(this));
    sequencePress(keys)
      .then(() => {
        this.blockKeys = false;
      });
  }

  roundFailed(expectedKey) {
    this.blockKeys = true;
    this.roundKoAudio.volume = 1;
    this.roundKoAudio.play();
    this.theRightKey = expectedKey;
  }

  roundOk() {
    this.blockKeys = true;
    this.theRightKey = null;
    this.roundOkAudio.volume = 1;
    this.roundOkAudio.play();
    return timeoutUtil.syncTimeout(500);
  }

  updateScore(score) {
    this.score = score;
  }

  resetTurn() {
    console.log('resteo');
    this.theRightKey = null;
  }
  /* *** end interface ***** */

  showKey(pos) {
    this.pressedKey = pos;
    return timeoutUtil.syncTimeout(this.timePerKey)
      .then(() => {
        this.pressedKey = null;
      })
      .then(() => timeoutUtil.syncTimeout(100));
  }

  setOkAudio(okAudio) {
    this.roundOkAudio = okAudio;
  }

  setKoAudio(koAudio) {
    this.roundKoAudio = koAudio;
  }

}
