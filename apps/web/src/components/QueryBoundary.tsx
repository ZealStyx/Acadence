'use client';
import {Component,type ReactNode} from 'react';
/** Convex query errors are thrown during rendering; keep the rest of the workspace usable. */
export default class QueryBoundary extends Component<{children:ReactNode},{failed:boolean;attempt:number}> {
 state={failed:false,attempt:0};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<section className="card staff-panel" role="alert"><h2>Couldn’t load your section</h2><p>Check your connection and try again. If the problem continues, contact your administrator.</p><button className="secondary" onClick={()=>this.setState(s=>({failed:false,attempt:s.attempt+1}))}>Try again</button></section>:<div key={this.state.attempt}>{this.props.children}</div>;}
}
