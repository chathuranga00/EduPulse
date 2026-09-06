import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:32,fontWeight:700,color:'#6366f1'}}>EduPulse AI</h1>
        <p style={{color:'#6b7280'}}>Backend API running on this server</p>
      </div>
    </div>
  </React.StrictMode>
)
