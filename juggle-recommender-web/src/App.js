import React, {Component} from 'react';
import { observer } from "mobx-react"
import {toJS} from "mobx"
import './App.css';
import TrickGraph from './trickGraph.js'
import TrickList from './trickList.js'
import Popup from './popup.js'
import {jugglingLibrary} from './jugglingLibrary.js'
import store from './store'
import uiStore from './uiStore'
import Swipe from 'react-easy-swipe';
import Auth from './auth.js'
import Modal from 'react-modal';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
@observer
class App extends Component {
 	state = {
 		filters : [],
 		selectedList : "allTricks",
 		edges : [],
 		nodes : [],
 		isPaneOpen: true,
 		isLoginPaneOpen: true,
 		swipedList : false
	}
	componentDidMount(){
		console.log("mounted")
		store.getSavedTricks()	
		console.log("finished loading")
		Modal.setAppElement(this.el);
	}
 	toggleFilter =(filter)=>{
 		let newFilters = []
 		if(!this.state.filters.includes(filter)){
 			newFilters.push(filter)
 		}
 		this.state.filters.forEach((curFilter)=>{
 			if(curFilter !== filter){
 				newFilters.push(curFilter)
 			} 			
 		})
 		this.setState({
 			filters : newFilters
 		})
 	} 	
 	handleStart=()=>{
 		console.log('startHandled')
 	}
 	render(){
 		uiStore.nodes
 		uiStore.edges
		return (
			<div className="App">
				<div ref={ref => this.el = ref}>		            
		            <SlidingPane
		                className='some-custom-class'
		                overlayClassName='some-custom-overlay-class'
		                isOpen={ this.state.isPaneOpen }
		                title='Instructions'
		                onRequestClose={ () => {
		                    this.setState({ isPaneOpen: false });}}>
		                <div className="instructions">

		                	<h2>Instructions</h2>
							<span>• ★ Star tricks you know to add to "Starred" tricks.</span><br/>
							<span>• Find new tricks to learn next that are related to tricks you starred ★.</span><br/>
							<span>• Sign in to access your tricks across devices, 
									otherwise tricks will be stored separately on each device</span><br/><br/>
							<span >Seeded from <a href="libraryofjuggling.com">libraryofjuggling.com</a></span>
							<div style={{"padding-left":"10px"}}>contact 
								<a style={{"color":"blue"}}>skilldex.feedback@gmail.com</a>
							</div>
						</div><br/>
		            </SlidingPane>'
		            <SlidingPane
		                className='some-custom-class'
		                overlayClassName='some-custom-overlay-class'
		                isOpen={ this.state.isLoginPaneOpen }
		                title='Login'
		                onRequestClose={ () => {
		                    this.setState({ isLoginPaneOpen: false });}}>
		                <div className="instructions">
		                	<Auth/><br/>

						</div><br/>
		            </SlidingPane>'
					<div className="title">
						<h1>Juggledex
			            <button style={{"float": "right"}} onClick={() => this.setState({ isPaneOpen: true })}>Instructions</button>
			            <button style={{"float": "right"}} onClick={() => this.setState({ isLoginPaneOpen: true })}>Login</button>
			            
			            </h1>
			            <h3>Gotta catch em all ;)</h3>
					</div>
					{this.state.swipedList ? 
						<div className="swipedDiv" 
							onClick={
								(event)=>{this.setState({swipedList : false})}
							}
						>+</div> : 
						<TrickList 
							myTricks={store.myTricks} 
							selectedList={uiStore.selectedList}
							selectedTricks={uiStore.selectedTricks}
						/>}
						<Popup/>
					<TrickGraph 
						nodes = {uiStore.nodes}
						edges = {uiStore.edges}/>
				</div>
			</div>
		);
	}
}
export default App;
