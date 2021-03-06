import Firebase from 'firebase';
import { getArrayFromFireSnapshot } from '../lib/fireutils';
import { byAsc } from '../lib/arrays';

// clevernotclean story, thanks artolamola <3 => https://twitter.com/artolamola/status/942422322354573312
const byNotFinishedYet = numTurn => player =>
  player.state !== 'waiting-for-players' &&
  player.lastFinishedTurn.numTurn < numTurn &&
  player.lastFinishedTurn.isOk;

const byFinishedGamePlayer = player =>
  player.state !== 'waiting-for-players' &&
  !player.lastFinishedTurn.isOk;

const byNotWaiting = player =>
  player.state !== 'waiting-for-players';

const getPlayersNotFinishedYet = (players, numTurn) => players
  .filter(byNotFinishedYet(numTurn));

const getPlayersFinished = players => players
  .filter(byFinishedGamePlayer);

const checkRoundFinishedAndResolve = numTurn => resolve => (players) => {
  const playersNotFinishedYet = getPlayersNotFinishedYet(players, numTurn);
  if (playersNotFinishedYet.length === 0) {
    resolve();
  }
  return playersNotFinishedYet.length === 0;
};

const checkGameFinishedAndResolve = resolve => (players) => {
  const playersFinished = getPlayersFinished(players);
  const playersPlaying = players.filter(byNotWaiting);

  if (playersFinished.length === playersPlaying.length) {
    resolve();
  }
  return playersFinished.length === playersPlaying.length;
};

const buildUserData = (name, userId) => ({
  name,
  userId,
  score: 0,
  userAgent: window.navigator.userAgent,
  lastUpdateDate: Firebase.database.ServerValue.TIMESTAMP,
  state: 'welcome',
  lastFinishedTurn: {
    numTurn: 0,
    isOk: true,
  },
});


export default class SimonlyMultiplayer {

  constructor(db, nameOfFamily) {
    this.db = db;
    this.nameOfFamily = nameOfFamily;
    this.connectedNode = null;
    this.userId = null;
    this.playersLocalCache = [];
    this.playersRef = this.db.ref(`${this.nameOfFamily}/players`);
    this.playersRef.on('value', snap => this.onPlayersChange(getArrayFromFireSnapshot(snap)));
  }

  onPlayersChange(players) {
    this.playersLocalCache = players;
    if (this.promisePendingResolve) {
      const roundFinished = this.checkPendingAndResolve(players);
      if (roundFinished) {
        this.checkPendingAndResolve = null;
        this.promisePendingResolve = null;
      }
    }
  }

  addPendingPromiseWhenPlayersChange(checkFunction) {
    return new Promise((resolve) => {
      this.promisePendingResolve = resolve;
      this.checkPendingAndResolve = checkFunction(resolve);
      this.playersRef.once('value', snap => this.onPlayersChange(getArrayFromFireSnapshot(snap)));
    });
  }

  setPresence(name) {
    const connectedRef = this.db.ref('.info/connected');
    const handleConnection = resolve => (isConnected) => {
      if (isConnected.val() === true) {
        this.connectedNode = this.connectedNode || this.playersRef.push();
        this.userId = this.connectedNode.key;
        this.connectedNode.onDisconnect().remove();
        this.connectedNode.set(buildUserData(name, this.userId))
          .then(() => resolve());
      }
    };

    return new Promise((resolve) => {
      connectedRef.on('value', handleConnection(resolve));
    });
  }

  updateLastUpdate() {
    return this.updatePropertyValue('lastUpdate', Firebase.database.ServerValue.TIMESTAMP);
  }

  updateScore(score) {
    return this.updatePropertyValue('score', score);
  }

  updateState(state) {
    return this.updatePropertyValue('state', state);
  }

  updateLastFinishedTurn(numTurn, isOk) {
    return this.updatePropertyValue('lastFinishedTurn', { numTurn, isOk });
  }

  waitForUsersFinishRound(numTurn) {
    return this.addPendingPromiseWhenPlayersChange(checkRoundFinishedAndResolve(numTurn));
  }

  waitForUsersFinishGame() {
    return this.addPendingPromiseWhenPlayersChange(checkGameFinishedAndResolve);
  }

  getUserId() {
    return this.userId;
  }

  isMaster() {
    const playersSorted = this.playersLocalCache.sort(byAsc('key'));
    return playersSorted[0].key === this.userId;
  }

  updatePropertyValue(property, value) {
    if (this.connectedNode) {
      return this.connectedNode.child(property).set(value);
    }
    return Promise.resolve();
  }

  getPlayers() {
    return this.db.ref(`${this.nameOfFamily}/players`).orderByChild('scoreDesc');
  }

}
