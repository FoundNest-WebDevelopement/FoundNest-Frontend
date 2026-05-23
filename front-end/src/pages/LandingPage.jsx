import { useNavigate } from 'react-router-dom';
import pana from '../assets/pana.png';
import logo from '../assets/logowhite.png';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
        <img 
          src={pana} 
          alt="Hero" 
          className="w-4/5 h-4/5 object-contain object-center" 
        />
      </div>

      <div className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-3"
        style={{ minHeight: '45%' }}
      >
        
        <div className="flex flex-row items-center justify-center gap-3">
          <img 
            src={logo} 
            alt="FoundNest Logo" 
            className="w-26 h-21 flex-shrink-0" 
          />
          <h1 className="text-white text-xl font-semibold leading-loose">
            Welcome to<br/>FoundNest!
          </h1>
        </div>

        <p className="text-white text-xs text-justify leading-relaxed">
          An official Lost and Found Management System for Bulacan State University.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white opacity-60"></div>
          <span className="text-white text-xs opacity-90">Ready to get started?</span>
          <div className="flex-1 h-px bg-white opacity-60"></div>
        </div>

    
        <p className="text-white text-xs text-center leading-relaxed opacity-80">
        Use Institutional account to access FoundNest.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-md text-sm"
          style={{ backgroundColor: '#FFEFEF', color: '#000000' }}
        >
          Log In
        </button>

      </div>
    </div>
  );
}

export default LandingPage;