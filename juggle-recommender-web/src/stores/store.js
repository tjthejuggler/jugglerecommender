import { action, configure, computed, observable} from "mobx"
import firebase from 'firebase'
import uiStore from './uiStore'
import authStore from './authStore'
import {jugglingLibrary} from '../jugglingLibrary.js'
import {TAGS} from '../tags';

configure({ enforceActions: "always" })
class Store {

	@observable startTime = null
	@observable myTricks = {}
	@observable highestCatches = 0
	@observable isLoginPaneOpen = false
	@observable isCreateAccountPaneOpen = false
	@observable library = {}
	@observable tagsSuggestions = []
	@observable contributors = []
	@observable presetTags = {}
	@observable videoURL = ""
	@observable igData = null
	@observable youtubeId = null
	@computed get isMobile(){
	   return true ?  /Mobi|Android/i.test(navigator.userAgent) : false
	}
	@computed get contributorTags(){
		const contributors = []
		for (let trick in this.library){
  			if (this.library[trick].contributor && 
  				!contributors.includes(this.library[trick].contributor)){
  					contributors.push(this.library[trick].contributor)
			}
  		}
  		contributors.push('Library Of Juggling')
  		this.setContributors(contributors)
 		const contributorTags = contributors.map((contributor) => {
		  return {
		  	size: null,
		    id: contributor,
		    text: contributor,
		  }
		})
		return contributorTags
	}
	@action setStartTime=(startTime)=>{
		this.startTime = startTime
	}
	@action setContributors=(contributors)=>{
		this.contributors = contributors
	}
	@action setVideoURL=(url, trickKey)=>{
		this.videoURL = url
		if (this.library[trickKey] &&
			this.library[trickKey].videoStartTime && 
			this.library[trickKey].videoEndTime &&
			url.includes("instagram.com")
		){
			const startTime = this.library[trickKey].videoStartTime
			const endTime = this.library[trickKey].videoEndTime
			this.videoURL = url+"#t="+startTime+","+endTime
		}	
	}
	@action setIGData=(data, trickKey)=>{
		if(!this.igData || 
			!this.library[trickKey] || 
			this.igData.username !== data.graphql.shortcode_media.owner.username){
			this.igData = {
				username : data.graphql.shortcode_media.owner.username,
				picURL :  data.graphql.shortcode_media.owner.profile_pic_url,
				profileURL : "https://www.instagram.com/"+data.graphql.shortcode_media.owner.username
			}
		}
	}
	@action getUsableVideoURL=(userProvidedURL, trickKey)=>{
      let videoURLtoUse = "notValid"
      if (userProvidedURL.includes("instagram.com")){
	    const usefulPart = userProvidedURL.match(new RegExp("(?:/p/)(.*?)(?:/)", "ig"))
	    videoURLtoUse = "https://www.instagram.com"+usefulPart+"?__a=1"  
	    const url = "https://www.instagram.com"+usefulPart+"?__a=1"
        fetch(url).then(
            response => response.json()
        ).then(
            (data) => {
            	if(data.graphql.shortcode_media.__typename === "GraphSidecar"){
					this.setVideoURL(data.graphql.shortcode_media.edge_sidecar_to_children.edges[0].node.video_url, trickKey)
					this.setIGData(data, trickKey)
	            }else{
	            	this.setVideoURL(data.graphql.shortcode_media.video_url, trickKey)
	            	this.setIGData(data, trickKey)
	            }
            }
        );                                
      }
      else if(userProvidedURL.includes("youtu")){
        let usefulPart
        if (userProvidedURL.includes("youtube.com/watch")){
          usefulPart = userProvidedURL.split('youtube.com/watch?v=')
          usefulPart = usefulPart[usefulPart.length-1]
          if (usefulPart.includes("&feature=youtu.be")){
            usefulPart = usefulPart.replace("&feature=youtu.be","")
          }
          //https://www.youtube.com/watch?v=Kr8LhLGjyiY            
        }else if (userProvidedURL.includes("youtu.be/")){
          //https://youtu.be/Kr8LhLGjyiY
          usefulPart = userProvidedURL.split('youtu.be/')
          usefulPart = usefulPart[usefulPart.length-1]            
        }
        videoURLtoUse = usefulPart
        this.setVideoURL("https://www.youtube.com/embed/"+usefulPart+
                       "?rel=0&autoplay=1&mute=1&loop=1&playlist="+usefulPart)
        this.youtubeId = usefulPart
      }
      return videoURLtoUse
    }
	@action setIsLoginPaneOpen=(isOpen)=>{
		this.isLoginPaneOpen = isOpen
	}
	@action toggleCreateAccountPane=()=>{
		this.isCreateAccountPaneOpen = !this.isCreateAccountPaneOpen
	}
	@action updateTricksInDatabase=()=>{
		if(!authStore.user){return}
		let myTricksKey = ""
 		let myTricksRef = firebase.database()
 									.ref('myTricks/')
 									.orderByChild('username')
 									.equalTo(authStore.user.username)
  	 	myTricksRef.on('value', resp =>{
           const myTricksObject =this.snapshotToArrayWithKey(resp)[0]
            if(myTricksObject){
            	myTricksKey = myTricksObject.key
            }
            myTricksRef.off()
            if(myTricksKey){
	            const userTricksRef = firebase.database().ref('myTricks/'+myTricksKey)
		        userTricksRef.set({	        	
		        		'username': authStore.user.username,
		        		'myTricks' : this.myTricks        	
		        })
            }else{
            	myTricksRef = firebase.database().ref('myTricks/')
                let newData = myTricksRef.push();
                newData.set({"username": authStore.user.username, "myTricks" : []});
            }            
        })
	}	
	
	@action getTricksFromBrowser=()=>{
		const myTricks = JSON.parse(localStorage.getItem("myTricks"))
    	if(myTricks  && Object.keys(myTricks).length > 0){
    		this.setMyTricks(myTricks)
    		//uiStore.setSelectedList("myTricks")
    	}else{
    		uiStore.setSelectedList("allTricks")
    		uiStore.toggleSelectedTrick('Cascade')
    	}
	}
	@action initializeLibrary=()=>{
		let libraryRef = firebase.database().ref('library/')
        libraryRef.set(jugglingLibrary);
	}
	@action getLibraryFromDatabase=()=>{
		let libraryRef = firebase.database().ref('library/')
		libraryRef.on('value', resp =>{
        	this.setLibrary(this.snapshotToObject(resp))
        })
	}
	@action ObjectLength=(object)=> {
	    var length = 0;
	    for( var key in object ) {
	        if( object.hasOwnProperty(key) ) {
	            ++length;
	        }
	    }
	    return length;
	}
	@action setLibrary=(library)=>{
		this.library = library
		//TODO clean this up
		uiStore.updateRootTricks() 
		uiStore.resetSelectedTrick()
		uiStore.updateRootTricks()
	}

	@action initializeTags=()=>{
		let tagRef = firebase.database().ref('tags/')
        tagRef.set(TAGS);
	}
	@action getTagsFromDatabase=()=>{
		let tagRef = firebase.database().ref('tags/')
		tagRef.on('value', resp =>{
        	this.setTagsSuggestions(this.snapshotToArray(resp))
        })
	}
	@action setTagsSuggestions=(tagsSuggestions)=>{
		this.tagsSuggestions = tagsSuggestions.sort()
		this.presetTags = this.tagsSuggestions.map((tag) => {
		  return {
		  	size: null,
		    id: tag,
		    text: tag,
		  }
		})
	}	
	@action removeOldDependents=(newTrickData, oldTrickKey)=>{
		const oldTrick = this.library[oldTrickKey]
		if(oldTrick.prereqs){
			let stalePrereqs
			if(newTrickData){
				stalePrereqs = oldTrick.prereqs.filter(x => !newTrickData.prereqs.includes(x))
			}else{//for the case of deleting a trick
				stalePrereqs = oldTrick.prereqs
			}
			stalePrereqs.forEach((prereq)=>{
				const trick = this.library[prereq]
				if(trick){
					const newDependents = trick.dependents.filter((x)=> x !== oldTrickKey)
					trick.dependents = newDependents
					//update prereq's dependents in db
					let newTrickRef = firebase.database().ref('library/'+prereq)
	        		newTrickRef.set(trick);
	        	}
			})
		}
	}
	@action removeTrickFromDatabase=(oldTrickKey)=>{
    	let oldTrickRef = firebase.database().ref('library/'+oldTrickKey)
		oldTrickRef.remove()
	}
	@action deleteTrick=()=>{
		var result = window.confirm("Are you sure you want to permanently delete this pattern?");
		if (result){
			const trickToDelete = uiStore.detailTrick.id
			uiStore.detailTrick = null
		    this.removeOldDependents(null,trickToDelete)
		    this.removeTrickFromDatabase(trickToDelete)
		}


	 }
	@action addTrickToDatabase=(trick)=>{
		const trickKey = 
			trick.name.replace(/\[/g,'({').replace(/\]/g,'})').replace(/\//g,'-')
		let oldTrickKey
		if(uiStore.editingDetailTrick){
			oldTrickKey = uiStore.detailTrick.id
			this.removeOldDependents(trick,oldTrickKey)
		}
		let newTrickRef = firebase.database().ref('library/'+trickKey)
        newTrickRef.set(trick);
        //if name changed, delete old reference in firebase
        //delete in mytricks and selected tricks, swap with new key
        
        if(uiStore.editingDetailTrick && trickKey !== uiStore.detailTrick.id){
        	if(uiStore.selectedTrick === oldTrickKey){
    			uiStore.toggleSelectedTrick(oldTrickKey)
    			uiStore.toggleSelectedTrick(trickKey)
    		}
        	if(this.myTricks[oldTrickKey]){
        		this.myTricks[trickKey] = this.myTricks[oldTrickKey]
        		delete this.myTricks[oldTrickKey]
        		this.updateTricksInDatabase()
		 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
        	}
        	let oldTrickRef = firebase.database().ref('library/'+oldTrickKey)
			oldTrickRef.remove()
		}

        this.addDependents(trick)
        this.addEquivalentRelated(trick)
        uiStore.toggleAddingTrick()
	}
	@action addDependents=(trick)=>{
		if(trick.prereqs){
			trick.prereqs.forEach((prereq)=>{
				if(this.library[prereq].dependents){
					this.library[prereq].dependents.push(trick.name)
				}else{
					this.library[prereq].dependents = [trick.name]
				}
				let prereqRef = firebase.database().ref('library/'+prereq)
        		prereqRef.set(this.library[prereq]);
			})
		}
	}
	@action addEquivalentRelated=(trick)=>{
		if(trick.related){
			trick.related.forEach((relatedTrick)=>{
				if(this.library[relatedTrick].related){
					this.library[relatedTrick].related.push(trick.name)
				}else{
					this.library[relatedTrick].related = [trick.name]
				}
				let relatedRef = firebase.database().ref('library/'+relatedTrick)
        		relatedRef.set(this.library[relatedTrick]);
			})
		}
	}
	@action getSavedTricks=()=>{
		if(authStore.user){
			const myTricksRef = firebase.database().ref('myTricks/').orderByChild('username').equalTo(authStore.user.username)
	  	 	myTricksRef.on('value', resp =>{
	           const myTricksObject =this.snapshotToArray(resp)[0]
	            if(myTricksObject && myTricksObject.myTricks){
	            	if(Object.keys(myTricksObject.myTricks).length > 1){
	            		this.setMyTricks(myTricksObject.myTricks)
	            	}
	            	uiStore.setSearchInput('')
	            	uiStore.resetSelectedTrick()
	            	uiStore.updateRootTricks()
	            }else{
	            	//For when we delete data for existing users
	            	this.getTricksFromBrowser()
	            	uiStore.resetSelectedTrick()
					uiStore.updateRootTricks()
	            }	           
	        })
	  	 }else{
	  	 	//Not logged in
	  	 	this.getTricksFromBrowser()
	  	 	uiStore.resetSelectedTrick()
	  	 	uiStore.updateRootTricks()
	  	 }	  
	}
	@action setCatches=(catches, trickKey)=>{
		if(!catches){
			catches = 0
		}
		if (catches.length>1){
 			catches = catches.replace(/^0+/,'');
 		}
 		this.myTricks[trickKey].catches = catches
 		const date = new Date()
 		this.myTricks[trickKey].lastUpdated = date.getTime()
 		this.updateTricksInDatabase()
 		uiStore.updateRootTricks()
 	}

	@action addToMyTricks=(trickKey)=>{
		const date = new Date()
 		this.myTricks[trickKey] = {
 			"catches" : 0,
 			"lastUpdated" : date.getTime()
 		}
        this.updateTricksInDatabase()
 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
 		uiStore.updateRootTricks()
 	}
 	@action findHighestCatches=()=>{
	    for(var trick in this.myTricks) {
	        if(this.myTricks[trick].catches>this.highestCatches){
	          this.highestCatches = parseInt(this.myTricks[trick].catches, 10)
	        }       
	    }
 	}
 	@action setMyTricks=(tricks)=>{
 		this.myTricks = tricks        
 		uiStore.updateRootTricks()
 		this.findHighestCatches()
 	}
 	@action removeFromMyTricks=(trickKey)=>{
		var result = window.confirm("Are you sure you want to remove this pattern and it's data from your list?");
		if (result){
			if (this.myTricks[trickKey]) {
				delete this.myTricks[trickKey]
			}
			this.updateTricksInDatabase()
	 		localStorage.setItem('myTricks', JSON.stringify(this.myTricks))
	 		uiStore.updateRootTricks()
		}
 	}
	@action snapshotToArray=(snapshot)=>{
	    let returnArr = [];	    
	    snapshot.forEach(childSnapshot => {
	    	let item = childSnapshot.val();
	        
	        returnArr.push(item);
	    });
	    return returnArr;
	}
	@action snapshotToArrayWithKey=(snapshot)=>{
	    let returnArr = [];	    
	    snapshot.forEach(childSnapshot => {
	        let item = childSnapshot.val();
	        item.key = childSnapshot.key;
	        returnArr.push(item);
	    });
	    return returnArr;
	}
	@action snapshotToObject=(snapshot) => {
	  let returnObj = {};
	  //returnObj["key"] = Object.keys(snapshot.val())[0]
	  snapshot.forEach(childSnapshot => {
	      returnObj[childSnapshot.key] = childSnapshot.val()
	  });
	  return returnObj;
	}
}

const store = new Store()

export default store