<template>
  <div class="simonly-music">
    <audio ref="backgroundAudio" loop
           :src="getBackgroundAudioName"></audio>
  </div>
</template>
<script>
  export default {
    name: 'simonly-music',
    components: {},
    data() {
      return {};
    },
    props: {
      track: {
        type: String,
        default() {
          return 'title';
        },
      },
    },
    methods: {},
    computed: {
      getBackgroundAudioName() {
        return `./static/audio/${this.track}-music.mp3`;
      },
    },
    watch: {
      getBackgroundAudioName() {
        const audio = this.$refs.backgroundAudio;
        const isPlaying = audio && audio.currentTime > 0 && !audio.paused && !audio.ended
          && audio.readyState > 2;
        if (isPlaying) {
          audio.pause();
        }
        if (audio && audio.load && audio.play) {
          setTimeout(() => {
            audio.currentTime = 0;
            audio.volume = (this.track === 'hall-of-fame') ? 1 : 0.3;
            audio.load();
            audio.play();
          }, 1000);
        }
      },
    },
    mounted() {
      if (this.$refs.backgroundAudio && this.$refs.backgroundAudio.play) {
        this.$refs.backgroundAudio.volume = 0.3;
        this.$refs.backgroundAudio.play();
      }
    },
  };
</script>
