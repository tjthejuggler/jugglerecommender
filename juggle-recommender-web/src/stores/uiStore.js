import { action, configure, observable, toJS} from "mobx"
import store from "./store"
import graphStore from "./graphStore"
import filterStore from "./filterStore"
import authStore from "./authStore"
import utilities from '../utilities'


configure({ enforceActions: "always" })
class UIStore {

	@observable selectedTrick = null
	@observable selectedList = "allTricks"
	@observable rootTricks = []
	@observable searchInput = ''
	@observable searchTrick = ''
	@observable listExpanded = true
	@observable popupCatchEditable = false
	@observable popupTrick = null
	@observable popupTimer = null
	@observable addingTrick = false
	@observable popupFullScreen = false
	@observable editingPopupTrick = false
	@action togglePopupFullScreen=()=>{
    	this.popupFullScreen = !this.popupFullScreen
    	console.log('this.popupFullScreen',this.popupFullScreen)
  	}
  	@action editPopupTrick=()=>{
  		this.editingPopupTrick = true
  		//shows form
  		this.addingTrick = true
  	}
	@action toggleAddingTrick = ()=>{
		if (!authStore.user){
			window.alert("You must be signed in to add a trick");
		}else{
			this.popupTrick = null
			this.addingTrick = !this.addingTrick
		}
		if(!this.addingTrick){
			this.editingPopupTrick = false
		}
	}
	@action closePopups = ()=>{
		this.popupTrick = null
		this.addingTrick = false
	}
	@action setListExpanded=(expanded)=>{
		this.listExpanded = expanded
	}
	@action clearTimer=()=>{
		this.popupTimer = null
	}
	@action setPopupTrick=(clickedTrick)=>{
		this.popupTimer = setTimeout(()=>{
			this.clearTimer()
		}, 500)
	 	this.popupTrick = clickedTrick
	 	this.popupCatchEditable = false
	}

	@action setPopupTrickToNull=()=>{
	 	this.popupTrick = null

	}

	@action toggleCatchEdit=(catches, trickKey)=>{

		this.popupCatchEditable = !this.popupCatchEditable
		
		if (!this.popupCatchEditable){
			store.setCatches(catches, trickKey)
			store.updateTricksInDatabase()
 			localStorage.setItem('myTricks', JSON.stringify(store.myTricks))
		}
	}
 	@action toggleSelectedTrick=(clickedTrick)=>{
 		if (this.selectedTrick === clickedTrick){
 			this.selectedTrick = null
 			console.log('this.selectedTrick',this.selectedTrick)
 			this.popupCatchEditable = false
 		}else{
	 		this.selectedTrick = clickedTrick
	 		console.log('clickedTrick2',clickedTrick)
	 	}	 	
 	}

	@action resetSelectedTrick=()=>{
		uiStore.updateRootTricks()
		if (!uiStore.rootTricks.includes(this.selectedTrick)){
			console.log('resetSelectedTrick')
			this.selectTopTrick()
		}
	}
	@action selectTopTrick=()=>{
		console.log('selectTopTrick')
		if (uiStore.rootTricks.length>0){
			this.selectedTrick = uiStore.rootTricks[0]
		}
	}
	@action selectTrick=(trick)=>{
		console.log('selectTrick')
		this.selectedTrick = trick
	}
 	@action setSelectedList=(listType)=>{
 		this.selectedList = listType
 		this.popupTrick = null
 		this.popupCatchEditable = false
 		this.resetSelectedTrick()
 		this.updateRootTricks()
 	}
 	@action toggleSelectedList(){
 		if (this.selectedList === 'myTricks'){
 			this.setSelectedList('allTricks')
 		}else{
 			this.setSelectedList('myTricks')
 		}
 	}


 	@action setSearchInput=(newInput)=>{
 		this.searchInput = newInput
 		this.performSearch()
 	}

 	@action	searchInputChange=(e)=>{
		uiStore.searchInput = e.target.value 		
		if(e.target.value === ""){
			this.searchTrick = ""
		}
		uiStore.setListExpanded(true)
		this.performSearch()
		//this.popupTrick = null
		this.resetSelectedTrick()
		this.updateRootTricks()
 	}
 		
 	@action performSearch=()=>{
 		this.selectedTrick = null
 		this.searchTrick = this.searchInput
 		this.updateRootTricks()
 	}

	@action containsAny=(trickArray,filterArray)=>{
		let containsAny = false
		for (var i = 0; i < trickArray.length; i++) {
		    if (filterArray.indexOf(trickArray[i]) > -1) {
		        containsAny = true;
		        break;
		    }
		}
		return containsAny
	}
	@action sortLibrary=()=>{
		let sortedJugglingLibrary
	 	if (filterStore.sortType === 'alphabetical'){
		 	sortedJugglingLibrary = utilities.sortObjectByAttribute(store.library, 'name');
		}else if (filterStore.sortType === 'difficulty'){
		 	sortedJugglingLibrary = utilities.sortObjectByAttribute(store.library, 'difficulty');
		}else if (filterStore.sortType === 'lastUpdated'){
			let tempLibraryWithTimes = store.library
			for (let trick in tempLibraryWithTimes){
				if (store.myTricks[trick] && store.myTricks[trick].lastUpdated){
					tempLibraryWithTimes[trick].lastUpdated = 999999999999 - store.myTricks[trick].lastUpdated
				}else{
					tempLibraryWithTimes[trick].lastUpdated = 0
				}
			}
			sortedJugglingLibrary = utilities.sortObjectByAttribute(tempLibraryWithTimes, 'lastUpdated');
		}else if (filterStore.sortType === 'catches'){
			let tempLibraryWithCatches = store.library
			for (let trick in tempLibraryWithCatches){
				if (store.myTricks[trick] && store.myTricks[trick].catches){
					tempLibraryWithCatches[trick].catches = store.myTricks[trick].catches
				}else{
					tempLibraryWithCatches[trick].catches = 0
				}
			}
			sortedJugglingLibrary = utilities.sortObjectByAttribute(tempLibraryWithCatches, 'catches');
		}else if (filterStore.sortType === 'timeSubmitted'){
			const tempLibraryWithSubmitted = store.library
			for (let trick in tempLibraryWithSubmitted){
				if (!tempLibraryWithSubmitted[trick].timeSubmitted){
					tempLibraryWithSubmitted[trick].timeSubmitted = 0
				}
			}
			sortedJugglingLibrary = utilities.sortObjectByAttribute(tempLibraryWithSubmitted, 'timeSubmitted');
		}
		if (filterStore.sortType === 'timeSubmitted'){
			if(filterStore.sortDirection==='ascending'){
				sortedJugglingLibrary.reverse()
			}
		}else{
			if(filterStore.sortDirection==='descending'){
				sortedJugglingLibrary.reverse()
			}
		}
		return sortedJugglingLibrary
	}
 	@action updateRootTricks=(rootTricks)=>{
 		if(Object.keys(store.library).length === 0){ return }
	 	this.rootTricks = []
 		const sortedJugglingLibrary = this.sortLibrary()
		const filterTagNames= []
		filterStore.tags.forEach(function (arrayItem) {
		    filterTagNames.push(arrayItem.id)
		});
		sortedJugglingLibrary.forEach((trickObj, i) => {
			const trickKey = Object.keys(trickObj)[0]
			const trick = trickObj[trickKey]
			if(this.selectedList === "allTricks" || 
			  (this.selectedList === "myTricks" && store.myTricks[trickKey])){
				const tagsInFilter = trick.tags? trick.tags.filter((tag)=>{
					if (filterTagNames.includes(tag)){
						return tag
					}else{
						return ''
					}
				}) : []
				let passesContributorFilter = false
				let overRideContributorFilter = false
				if (filterStore.contributors.length===0){
					passesContributorFilter = true
				}else{
					filterStore.contributors.forEach(function (arrayItem) {
					    if (trick.contributor === arrayItem.id ){
					    	passesContributorFilter = true
					    }
					    if (trick.contributor == null && 
					    	arrayItem.id === "Library Of Juggling"){
					    	passesContributorFilter = true
					    }
					})
				}
				let thisTricksCatches = 0
				if(store.myTricks[trickKey] && store.myTricks[trickKey].catches){
					thisTricksCatches = parseInt(store.myTricks[trickKey].catches, 10)
				}
				if(
				   passesContributorFilter &&
				   parseInt(trick.difficulty, 10) >= filterStore.difficultyRange[0] && 
				   parseInt(trick.difficulty, 10) <= filterStore.difficultyRange[1] &&
				   (tagsInFilter.length >= filterTagNames.length || filterTagNames.length === 0) &&
				   (filterStore.numBalls.includes(trick.num.toString()) || filterStore.numBalls.length === 0) &&
				   thisTricksCatches >= parseInt(filterStore.minCatches, 10) &&
				   thisTricksCatches <= parseInt(filterStore.maxCatches, 10) &&
				   (this.searchTrick === '' || trick.name.toUpperCase().includes(this.searchTrick.toUpperCase()))
				 ){
					this.rootTricks.push(trickKey)
				}
			}
		})	
		
		graphStore.updateGraphData()
	}

	 @action clearCatchInput=()=>{
	 	this.catchInput = ''
	 }
}

const uiStore = new UIStore()

export default uiStore