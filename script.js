'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerEntries = document.querySelector('.entries');
const inputType = document.querySelector('.form__input--type');
const inputName = document.querySelector('.form__input--distance');
const inputAdress = document.querySelector('.form__input--duration');
const inputUniqueNum = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const logo = document.querySelector('.logo');

const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

class Entry {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, fullName, adress) {
    this.coords = coords;
    this.fullName = fullName;
    this.adress = adress;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Finished extends Entry {
  type = 'Finished';
  constructor(coords, fullName, adress, uniqueNum) {
    super(coords, fullName, adress);
    this.uniqueNum = uniqueNum;
    this._setDescription();
  }
}

class Pending extends Entry {
  type = 'Pending';
  constructor(coords, fullName, adress, uniqueNum) {
    super(coords, fullName, adress);
    this.uniqueNum = uniqueNum;
    this._setDescription();
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map;
  #mapZoumLevel = 13;
  #mapEvent;
  #entries = [];

  constructor() {
    //Load Map
    this._getPosition();

    //Get data from local storage
    this._getlocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newEntry.bind(this));
    containerEntries.addEventListener('click', this._moveToPopup.bind(this));
    logo.addEventListener('click', this.reset);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.gr/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoumLevel);
    // console.log(map);

    L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    // L.marker(coords)
    //   .addTo(this.#map)
    //   .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    //   .openPopup();

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#entries.forEach(entry => {
      this._renderEntry(entry);
      this._renderEntryMarker(entry);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputName.focus();
  }

  _hideForm() {
    // Empty inputs
    inputName.value =
      inputAdress.value =
      inputUniqueNum.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newEntry(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const fullName = inputName.value;
    const adress = inputAdress.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let entry;

    //if workout running, create running object

    const uniqueNum = inputUniqueNum.value;
    const elevation = inputElevation.value;

    if (type === 'Finished')
      entry = new Finished([lat, lng], fullName, adress, uniqueNum, type);

    if (type === 'Pending')
      entry = new Pending([lat, lng], fullName, adress, uniqueNum, type);

    // Add new object to workout array
    this.#entries.push(entry);
    console.log(entry);

    //Render workout on list

    this._renderEntry(entry);

    //Render workout on map as marker

    this._renderEntryMarker(entry);

    // hide form + Clear input fields
    this._hideForm();

    // set local storage to all workouts
    this._setLocalStorage();
  }

  _renderEntryMarker(entry) {
    L.marker(entry.coords, {
      icon: redIcon,
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${entry.type}-popup`,
        })
      )
      .setPopupContent(`${entry.description}`)
      .openPopup();
  }

  _renderEntry(entry) {
    let html = `
        <li class="workout workout--${entry.type}" data-id="${entry.id}">
          <h2 class="workout__title">${entry.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🧔</span>
            <span class="workout__value">${entry.fullName}</span>

          </div>
          <div class="workout__details">
            <span class="workout__icon">🎏</span>
            <span class="workout__value">${entry.adress}</span>

          </div>
          <div class="workout__details">
          <span class="workout__icon">${
            entry.type === 'Finished' ? '✅' : '⛔'
          }</span>
          <span class="workout__value">${entry.type}</span>

        </div>
        <div class="workout__details">
          <span class="workout__icon">🆔</span>
          <span class="workout__value">${entry.uniqueNum}</span>

        </div>
      </li>
          `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#entries.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoumLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // inputAdress.value = inputUniqueNum.value = inputElevation.value = '';
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#entries));
  }

  _getlocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;

    this.#entries = data;
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// console.log(app);
