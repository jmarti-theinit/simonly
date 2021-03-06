/* eslint-disable no-console */
import Vue from 'vue';
import { mount } from 'avoriaz';
import VueResource from 'vue-resource';
import SimonlyBoard from './SimonlyBoard.vue';
import SimonlyGame from '../../game-lib/SimonlyGame';
import SimonlyStorage from '../../game-lib/SimonlyStorage';
import vueIoc from '../../lib/vue-ioc';
import ioc from '../../lib/ioc';

Vue.use(VueResource);

const SimonlyUIMock = () => ({
  theRightKey: 0,
  showSequence: () => {
  },
  roundFailed: () => {
  },
  roundOk: () => {
  },
  updateScore: () => {
  },
  setOkAudio: () => {
  },
  setKoAudio: () => {
  },
});

const simonlyMockIOC = () => {
  const localUI = SimonlyUIMock();
  const multiplayerUI = SimonlyUIMock();
  ioc.set('simonlyLocalUI', localUI);
  ioc.set('simonlyUI', multiplayerUI);
  ioc.set('simonlyGame', new SimonlyGame(multiplayerUI));
  ioc.set('simonlyStorage', new SimonlyStorage());
  ioc.set('queries', {
    top10: () => [],
    addTop10: () => [],
  });
  ioc.set('multiplayerHudQueries', { players: () => [] });
  ioc.set('simonlyMultiplayer', {
    setPresence: () => {
    },
    updateState: () => Promise.resolve(),
    waitForUsersFinishGame: () => Promise.resolve(),
  });
  ioc.set('simonlyMultiplayerKeysGenerator', {
    addKeys: () => { },
    cleanSequence: () => { },
  });

  Vue.use(vueIoc);
};

describe('SimonlyBoard', () => {
  let wrapper;
  let vm;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    simonlyMockIOC();
    ioc.set('config', { numKeys: 4, nameOfFamily: 'testFamily' });
    wrapper = mount(SimonlyBoard);
    vm = wrapper.vm;
  });

  afterEach(() => {
    clock.restore();
  });

  it('sets ups', () => {
    expect(vm).to.be.defined;
    expect(vm.simonlyGame).to.be.defined;
  });

  describe('welcome page', () => {
    it('shows at beginning', () => {
      expect(vm.currentState).to.equal('welcome');
    });

    it('hides when start', (done) => {
      vm.restart();

      vm.$nextTick(() => {
        expect(vm.currentState).not.to.equal('welcome');
        done();
      });
    });
  });

  describe('waiting for other players', () => {
    it('shows when starting', (done) => {
      vm.restart();

      vm.$nextTick()
        .then(() => {
          expect(vm.currentState).to.equal('waiting-for-players');
          done();
        });
    });

    it('hides when ready', (done) => {
      vm.currentState = 'waiting-for-players';

      vm.waitForOthersReadyCallback();

      vm.$nextTick(() => {
        expect(vm.currentState).to.equal('321');
        done();
      });
    });
  });

  it('starts game after 321 page', (done) => {
    vm.simonlyGame.gameInfo.numTurn = 5;

    vm.show321AndStart();

    vm.$nextTick(() => {
      clock.tick(3001);
      vm.$nextTick(() => {
        expect(vm.simonlyGame.gameInfo.numTurn).to.equal(1);
        done();
      });
    });
  });

  describe('3, 2, 1 page', () => {
    it('shows after ready callback', (done) => {
      vm.waitForOthersReadyCallback();

      vm.$nextTick(() => {
        expect(vm.currentState).to.equal('321');
        done();
      });
    });

    it('hides after 3 secs', (done) => {
      vm.waitForOthersReadyCallback();

      vm.$nextTick(() => {
        clock.tick(3001);
        expect(vm.currentState).to.equal('playing');
        done();
      });
    });
  });

  describe('hall of fame showing or hiding is controlled', () => {
    it('shows when loosing', (done) => {
      vm.hallRows = [];
      vm.simonlyLocalUI.theRightKey = 3;

      vm.$nextTick(() => {
        clock.tick(5005);
        vm.$nextTick(() => {
          expect(vm.currentState).to.equal('hall-of-fame');
          done();
        });
      });
    });
  });

  describe('multiplayer hud showing or hiding is controller', () => {
    const TEST_DATA = [
      { state: '321', expectedShown: true },
      { state: 'playing', expectedShown: true },
      { state: 'welcome', expectedShown: false },
      { state: 'hall-of-fame', expectedShown: false },
    ];

    TEST_DATA.forEach((test) => {
      it(`handles case for: ${test.state} expectedShown: ${test.expectedShown}`, (done) => {
        vm.currentState = test.state;

        vm.$nextTick()
          .then(() => {
            expect(vm.$el.getElementsByClassName('multiplayer-hud').length).to.equal(test.expectedShown ? 1 : 0);
            done();
          });
      });
    });
  });

  it('adds multiplayer presence when starting after welcome', (done) => {
    ioc.get('simonlyStorage').set('name', 'Jordi');
    ioc.get('simonlyMultiplayer').setPresence = sinon.spy();
    wrapper = mount(SimonlyBoard);
    vm = wrapper.vm;

    vm.$mount();
    vm.restart();

    vm.$nextTick(() => {
      expect(vm.simonlyMultiplayer.setPresence).to.have.been.calledWith('Jordi');
      done();
    });
  });
});
