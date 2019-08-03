

import React,{Component} from 'react'
import store from './stores/store'
import authStore from './stores/authStore'

import filterStore from './stores/filterStore'
import uiStore from './stores/uiStore'
import { observer } from "mobx-react"
import downArrow from './images/down-arrow.svg'
import catchesIcon from './images/catchesIcon.svg'
import Demo from './demo'
import MainTagsBar from "./mainTagsBar"
import './trickList.css';
import './App.css';
import Gauge from 'react-svg-gauge';
import utilities from './utilities'
//import { Resizable } from "re-resizable";
import ReactGA from 'react-ga';
import history from './history';
import InfiniteScroll from 'react-infinite-scroller';
import "./comments.css"
const paginationSize = 20

@observer
class Comments extends Component {
	
    state = {
        newComment : "",
    }

    getTimeDiff=(referenceTimestamp)=>{
        const curTime = new Date()
        const timeDiff = curTime.getTime() -  Date.parse(referenceTimestamp) 
        const diffDays = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        const diffHours = Math.round(timeDiff / (1000 * 60 * 60));
        const diffMinutes = Math.round(timeDiff / (1000 * 60));
        const diffseconds = Math.round(timeDiff / (1000));

        if(diffDays > 0){
            return diffDays + "d"
        }else if (diffHours > 0){
            return diffHours + "h"
        }else if (diffMinutes > 0){
            return diffMinutes + "m"
        }else if (diffseconds > 0){
            return diffseconds + "s"
        }
    }
    showReplies=(key)=>{
        store.toggleShowReplies(key)
    }
    hideReplies=(key)=>{
        store.toggleShowReplies(key)
    }
    enableReply=(key)=>{
        store.toggleEnableReplies(key)
    }
    replyComment= (parent)=>{

        let commentData = {
          comment: this.state.newComment,
          parentId: parent.key,
          previousKeys : parent.previousKeys + parent.key + "/replies/",
          date: Date(),
          user:authStore.user.username,
          parentPost: false,
        };
        store.createComment(commentData).then(data => {
            if(!store.showReplyStates[parent.key]){
                store.toggleShowReplies(parent.key)
                store.toggleEnableReplies(parent.key)
            }
            console.log("setting")
            this.setState({ newComment : "" })
        })        
    }			
    like=(commentKey)=>{

    }

	render() {
	 	let comments = this.props.comments.map((comment)=>{
            return <div>
                        <div className="commentContainer">
                            <span className="commentUser">{comment.user}</span>
                            <span className="commentText">{comment.comment}</span>
                        </div>
                        <div>
                            <button className="replyButton" onClick={()=>{this.like(comment.key)}}>Like</button>
                            <button className="replyButton" onClick={()=>{this.enableReply(comment.key)}}>Reply</button>
                            <span className="date">{this.getTimeDiff(comment.date)}</span>
                        </div>
                        { 
                            store.enableReplyStates[comment.key] ? 
                            <div>
                                <input 
                                    className="replyInput" 
                                    placeholder="Write a reply..." 
                                    type="text"  
                                    name="comment.key"
                                    onChange={(e)=>{
                                        this.setState({newComment : e.target.value })
                                    }}
                                    value={this.state.newComment}
                                />
                                <button className="submitButton"  onClick={()=>{this.replyComment(comment)}}>Submit</button>
                            </div> : 
                            null
                        }
                        
                        
                        {comment.replies ?
                        <button className="replyButton" onClick={()=>{this.showReplies(comment.key)}}>
                        {store.showReplyStates[comment.key] ? 'Hide Replies' : 'Read ' + (Object.keys(comment.replies).length + 1) + ' Replies'}</button>
                        :null
                        }
                        { comment.replies && store.showReplyStates[comment.key] ? 
                            <div className="reply">
                                <Comments comments={utilities.objectToArray(comment.replies)}></Comments>
                            </div> : null}

                    </div>         
    	 		
            
	 	})
		return (
			<div>
				{comments}
			</div>
		)
	}
}

export default Comments