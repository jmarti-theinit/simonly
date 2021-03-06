import Vue from 'vue';
import { mount } from 'avoriaz';
import VueResource from 'vue-resource';
import SimonlyMusic from './SimonlyMusic.vue';

Vue.use(VueResource);

describe('SimonlyMusic', () => {
  let wrapper;
  let vm;

  beforeEach(() => {
    wrapper = mount(SimonlyMusic);
    vm = wrapper.vm;
    vm.$refs.backgroundAudio = {
      volume: 0,
      play: () => {},
    };
  });

  it('sets ups', () => {
    expect(vm).to.be.defined;
  });

  it('gets background name based on track', () => {
    vm.track = 'welcome';

    expect(vm.getBackgroundAudioName).to.contain('/audio/welcome-music.mp3');
  });
});
