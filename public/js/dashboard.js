function startClock() {
  setInterval(() => {
    const d = new Date();
    const day = ['일','월','화','수','목','금','토'];

    const text =
      d.getFullYear() + '-' +
      (d.getMonth()+1) + '-' +
      d.getDate() + ' ' +
      d.getHours() + ':' +
      d.getMinutes() + ':' +
      d.getSeconds() +
      '(' + day[d.getDay()] + ')';

    const el = document.getElementById('clock');
    if (el) el.innerText = text;

  }, 1000);
}

document.addEventListener('DOMContentLoaded', startClock);
