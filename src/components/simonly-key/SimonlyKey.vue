<template>
  <div class="container">
    <img :class="{ keyImage: true,
                   keyPressed: (pressed || externallyPressed),
                   animateBigger: (showRightKey !== null && showRightKey === position),
                   animateSmaller: (showRightKey !== null && showRightKey !== position)
                 }"
         v-on:mousedown="pressImage"
         :src="src">
    <audio ref="audio" preload="auto"></audio>
  </div>
</template>
<style scoped src="./SimonlyKey.css"></style>
<script>
  import { mediaPreload } from '../../lib/media-preload';

  const DEFAULT_TIME_PER_KEY = 800;

  export default {
    name: 'simonly-key',
    data() {
      return {
        pressed: false,
      };
    },
    props: {
      position: {
        type: Number,
        default() {
          return 1;
        },
      },
      skin: {
        type: Number,
        default() {
          return 0;
        },
      },
      overwriteSkin: {
        type: String,
        default() {
          return null;
        },
      },
      overwriteAudio: {
        type: String,
        default() {
          return null;
        },
      },
      type: {
        type: String,
        default() {
          return 'separate';
        },
      },
      externallyPressedKey: {
        type: Number,
        default() {
          return null;
        },
      },
      timePerKey: {
        type: Number,
        default() {
          return DEFAULT_TIME_PER_KEY;
        },
      },
      showRightKey: {
        type: Number,
        default() {
          return null;
        },
      },
      readonly: false,
    },
    computed: {
      src() {
        return this.overwriteSkin ? this.overwriteSkin : `./static/key-files/${this.skin}.png`;
      },
      externallyPressed() {
        this.playAudioIf(this.externallyPressedKey === this.position);
        return this.externallyPressedKey === this.position;
      },
    },
    methods: {
      playAudioIf(condition) {
        if (condition) {
          this.playAudio()
            .then(() => {
              setTimeout(() => {
                this.stopAudio();
              }, this.timePerKey);
            });
        }
      },
      playAudio() {
        const audio = this.$refs.audio;
        if (audio && audio.play) {
          audio.currentTime = 0;
          audio.volume = 1;
          try {
            return audio.play();
          } catch (e) {
            return Promise.resolve({});
          }
        }
        return Promise.resolve({});
      },
      stopAudio() {
        const audio = this.$refs.audio;
        const isPlaying = !audio.paused && !audio.ended
          && audio.readyState > 2;
        if (isPlaying) {
          audio.pause();
        }
      },
      pressImage() {
        if (this.showRightKey !== null) return;
        if (this.readonly) return;
        this.playAudio()
          .then(() => {
            this.pressed = true;
            setTimeout(() => {
              this.releaseImage();
            }, this.timePerKey);
          });
      },
      releaseImage() {
        this.pressed = false;
        this.stopAudio();
        this.$emit('keypress', { key: this.position });
      },
      getAudioSrc() {
        return this.overwriteAudio ? this.overwriteAudio : `./static/key-files/${this.skin}.m4a`;
      },
      preloadAudio() {
        mediaPreload(this.getAudioSrc())
          .then((video) => {
            this.$refs.audio.src = video;
          })
          .catch(() => {
            this.$refs.audio.src = this.getAudioSrc();
          });
      },
    },
    mounted() {
      this.preloadAudio();
      const audio = this.$refs.audio;
      if (audio && audio.load) {
        audio.load();
      }
    },
  };
</script>
