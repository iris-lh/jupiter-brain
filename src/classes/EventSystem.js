module.exports = class EventSystem {
  constructor() {
    this.events = {}
  }

  subscribe(id, eventName, callBack) {
    if (!(typeof this.events[eventName] == 'object')) {
      this.events[eventName] = []
    }

    this.events[eventName].push(
      {id: id, callBack: callBack}
    )
  }

  unsubscribe(id, eventName) {
    this.events[eventName] = this.events[eventName].without(subscriber => subscriber.id == id)
  }

  getSubscription() {
    return 
  }

  fire(eventName = '', params = {}) {
    this.events[eventName].forEach(subscription => {
      subscription.callBack(params)
    });
  }
}