import React, {Component} from 'react';
import uiStore from "./stores/uiStore"
import "./homeScreen.css"
import { observer } from "mobx-react"
import { toJS } from "mobx"
import authStore from "./stores/authStore"
import store from "./stores/store"
import { WithContext as ReactTags } from 'react-tag-input';
import utilities from './utilities'
import AutoComplete from './autoComplete'
import TrickList from './trickList.js'
import Demo from './demo'
import history from './history';
import downArrow from './images/down-arrow.svg'

@observer
class HomeScreen extends Component {
	state ={
		
	}
	componentDidMount(){
		store.getTrickOfTheDay()
	}
	clickPatternList=()=>{
		history.push('/tricklist')
		uiStore.clearUI()
		//uiStore.toggleShowHomeScreen()
		utilities.sendGA('home screen','pattern list')	
	}
	openDetail=()=>{
		uiStore.setDetailTrick(
			{...store.library[store.randomLeaderboardTrick.key], id: store.randomLeaderboardTrick.key}
		)
		history.push('/detail/'+uiStore.detailTrick.id, {detail : uiStore.detailTrick.id})
		utilities.sendGA('home screen','detail')
		store.increaseViewsCounter()
	}		
	render (){
    const backButton = <img id="backButton" 
                            src={downArrow} 
                            className="backButtonHome rotatedNegative90" 
                            alt="backIcon" 
                            onClick={()=>{ uiStore.handleBackButtonClick()}}
                        />
		return(
				<div className = "homeOuterDiv">					
					<div className ='homeScreenTrickOuterDiv'>
						<div className = 'statsLabel'>Users </div>{store.userCount}
						<div className = 'statsLabel'>Patterns</div>{store.patternCount}
						<div className = 'statsLabel'>Catches</div>{store.totalCatchCount}
				    </div>
				    {store.randomLeaderboardTrick && Object.keys(store.library).length > 0 ? 
							<div className = 'homeScreenTrickDiv'>
					            <h3 style={{marginBottom: "10px"}}>Pattern of The Day</h3>
					            <button className="detailButton" onClick = {this.openDetail}>View Details</button>
				            	<Demo 
					            	trickKey={store.randomLeaderboardTrick.key}
		                         	demoLocation="home"
		  						/>
		  						<div className = "info">
						           	<span className='infoLabel'>Pattern</span> 
						           	{store.randomLeaderboardTrick.key} 
						        </div>
					        </div>
						: null
					}
					<button className = "patternListButton"
							onClick={this.clickPatternList}>
						All Patterns
					</button>				    
				</div>
			)
	}
}
export default HomeScreen

