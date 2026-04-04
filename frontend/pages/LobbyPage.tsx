import {useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {Character} from "../src/interfaces/interface.tsx";
import "../css/lobby.css";


const Characters: Character[] = [
    {id:1 , name:"Owl", image:"../images/owl.png"},
    {id:2 , name:"Leopard", image:"../images/leo.png"},
    {id:3 , name:"Mouse", image:"../images/mouse.png"},
    {id:4 , name:"Bear", image:"../images/bear.png"},
]

export default function LobbyPage(){
    const { lobbyId } = useParams<{ lobbyId: string }>();
    const navigate = useNavigate();

    const [index, setIndex] = useState(0);          // för att ha koll på vilken karaktär visas
    const character = Characters[index];            //aktuella karaktären baserat på index
    const prev = () => setIndex((i) => (i - 1 + Characters.length) % Characters.length);  // + Characters.length för att undvika negativ index
    const next = () => setIndex((i) => (i + 1) % Characters.length); //i är nuvarande index och adderas med 1, % används för att hoppa tillbaka till första index

    const [ready, setReady] = useState(false);

    const shareUrl = window.location.href;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        alert("Länk kopierad!");
    };

    return(
        <div className="page">
            <div className="container">
                <div className="col">
                    <h1 className="title">VÄLJ EN KARAKTÄR</h1>
                    {lobbyId && (
                        <div className="lobby-info" style={{ 
                            marginBottom: '30px', 
                            textAlign: 'center', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.45)',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(160, 80, 255, 0.25)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
                        }}>
                            <p className="wm-modal-label" style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '0.1em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                LOBBY ID: <strong style={{ color: '#eedeff', textShadow: '0 0 10px rgba(160, 80, 255, 0.5)' }}>{lobbyId}</strong>
                            </p>
                            <button 
                                onClick={copyToClipboard} 
                                className="wm-modal-btn wm-modal-btn--cancel" 
                                style={{ padding: '10px 24px', width: 'fit-content', fontSize: '1rem' }}
                            >
                                Kopiera inbjudningslänk
                            </button>
                        </div>
                    )}

                    <div className="character-carousel">
                        <button className="ch-arrow" onClick={prev}>
                            <img src="/images/prev.png" className="ch-arrow-img" />
                        </button>

                        <div className="characters">
                            <img key={character.id} src={character.image} alt={character.name}/>
                        </div>

                        <button className="ch-arrow" onClick={next}>
                            <img src="/images/next.png" className="ch-arrow-img" />
                        </button>
                    </div>

                    <button 
                        className={`ready-btn ${ready? "isReady-btn" : ""}`}
                        onClick={() => {
                            if (ready) {
                                navigate(`/game/${lobbyId || ''}`);
                            } else {
                                setReady(true);
                            }
                        }}
                    >
                        {ready? "Starta spelet" : "Redo"}
                    </button>

                </div>
            </div>
            
        </div>
    );
}