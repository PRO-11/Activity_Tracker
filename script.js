'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App{
    #map;
    #workouts=[];
    #mapcord;
    #mapZoomLevel=13;
    constructor()
    {
    this._getPosition();
    this._initalizeWorkout();
    inputType.addEventListener('change',this._toggleElevationField.bind(this))
    form.addEventListener('submit',this._newWorkout.bind(this))
    containerWorkouts.addEventListener('click',this._handleMove.bind(this))
    }
    _getPosition()
    {
        navigator?.geolocation.getCurrentPosition(this._loadMap.bind(this),function(err){
        console.log('Cant get position')})
    }
    _loadMap(position){
    const {longitude,latitude}=position.coords
    const cord=[latitude,longitude]
    
    
    this.#map = L.map('map').setView(cord, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    
    this.#map.on('click',this._showForm.bind(this))
    this.#workouts.forEach((d)=>{
    this._displayMarker(d)
    })
    
    }
    _showForm(event){
    form.classList.remove('hidden')
    this.#mapcord=[event.latlng.lat,event.latlng.lng]
    }
    _toggleElevationField()
    {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _setDescription(workout)
    {
        const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        console.log(workout)
        workout.description=`${workout.name[0].toUpperCase()}${workout.name.slice(1)} on ${days[workout.date.getDay()]} ${workout.date.getDate()} `
    }
    _newWorkout(e){
    e.preventDefault();
    const checkFinite=(...data)=>data.every((d)=>isFinite(d));
    const checkPositive=(...data)=>data.every((d)=>d>=0);
    const type=inputType.value,distance=+inputDistance.value,duration=+inputDuration.value;
    const [latitude,longitude]=this.#mapcord
    let newobj;
    if(type=="running")
    {
        const cadence=+inputCadence.value;
        console.log(type,distance,duration,cadence)
        if(!checkFinite(distance,duration,cadence) || !checkPositive(distance,duration,cadence)){
            alert('Enter valid Number')
            return ;
        }
        
         newobj=new Running([latitude,longitude],distance,duration,cadence)
         
    }
    else
    {
        const elevation=+inputElevation.value;
        if(!checkFinite(distance,duration,elevation) || !checkPositive(distance,duration)){
            alert('Enter valid Number')
            return ;
        }
         newobj=new Cycling([latitude,longitude],distance,duration,elevation)
        }
    this.#workouts.push(newobj)
    this._setDescription(newobj)
    this._displayMarker(newobj)
    this._renderWorkOut(newobj)     
    }
    _displayMarker(newobj)
    {
    L.marker(newobj.coords).addTo(this.#map)
    .bindPopup(L.popup({maxWidth:250,minWidth:100,autoClose:false,closeOnClick:true,className:`${newobj.name}-popup`}))
    .setPopupContent(`${newobj.name=='running'?'🏃‍♂️':'🚴‍♀️'} ${newobj.description}`).openPopup()
    }
    _renderWorkOut(workout)
    {
        
        
        let htmlData=`<li class="workout workout--${workout.name}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.name=='running'?'🏃‍♂️':'🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
        if(workout.name=='running')
        {
            htmlData+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }
        else
        {
            htmlData+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }
        form.insertAdjacentHTML("afterend",htmlData)
        inputCadence.value=inputDistance.value=inputDuration.value=inputElevation.value=''
        this._hideForm()

        this._storeWorkout()
    }
    _hideForm()
    {
        form.style.display='none'
        form.classList.add('hidden')
        setTimeout(()=>form.style.display='grid',1000)
    }
    _handleMove(e)
    {
        const data=e.target.closest('.workout')
        if(!data)
        return 
        const id=data.getAttribute('data-id')
        const workout=this.#workouts.find((d)=>d.id===id)
        this.#map.setView(workout.coords,this.#mapZoomLevel,{
            animate:true,
            pan:{
                duration:1
            }
        })
    }
    _storeWorkout()
    {
        localStorage.setItem('workouts',JSON.stringify(this.#workouts))
    }
    _initalizeWorkout(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        if(!data)
            return 
        this.#workouts=data
        this.#workouts.forEach((d)=>{
            this._renderWorkOut(d)
        })
    }
    _reset()
    {
        localStorage.removeItem('workouts')
        location.reload()
    }
};

class WorkOut{
    id=(Date.now()+'').slice(-10)
    date=new Date();
    constructor(coords,distance,duration)
    {
        this.coords=coords
        this.distance=distance
        this.duration=duration
    }
}
class Running extends WorkOut{
    constructor(coords,distance,duration,cadence)
    {
        super(coords,distance,duration);
        this.cadence=cadence;
        this.name="running"
        this.calc_pace()
    }
    calc_pace()
    {
        this.pace=this.duration/this.distance
        return this.pace
    }

}
class Cycling extends WorkOut{
    constructor(coords,distance,duration,elevation)
    {
        super(coords,distance,duration);
        this.elevation=elevation;
        this.name="cycling"
        this.calc_speed()
    }
    calc_speed()
    {
        this.speed=this.distance/(this.duration/60)
        return this.speed
    }
}


const app=new App();