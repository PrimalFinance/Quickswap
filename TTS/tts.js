const say = require("say");

class TextToSpeech {
  voice;
  constructor(_voice = "Microsoft Zira Desktop") {
    this.voice = _voice;
  }

  speak(text, speechSpeed = 1.4) {
    say.speak(text, this.voice, speechSpeed, (err) => {
      if (err) {
        return console.error(err);
      }
    });
  }

  getVoices() {
    say.getInstalledVoices((err, voices) => {
      if (err) {
        return console.error(err);
      }
      console.log("Available voices:", voices);
    });
  }
}

module.exports = {
  TextToSpeech,
};
