import {useState} from "react";
import type {Character} from "../interfaces/interface.tsx";
import "/sass/lobby.css";


const Characters: Character[] = [
    {id:1 , name:"Owl", image:"../images/owl.png"},
    {id:2 , name:"Leopard", image:"../images/leo.png"},
    {id:3 , name:"Mouse", image:"../images/mouse.png"},
    {id:4 , name:"Bear", image:"../images/bear.png"},
]

export default function LobbyPage(){

    const [index, setIndex] = useState(0);          // för att ha koll på vilken karaktär visas
    const character = Characters[index];            //aktuella karaktären baserat på index
    const prev = () => setIndex((i) => (i - 1 + Characters.length) % Characters.length);  // + Characters.length för att undvika negativ index
    const next = () => setIndex((i) => (i + 1) % Characters.length); //i är nuvarande index och adderas med 1, % används för att hoppa tillbaka till första index



    return(
        <div className="page">
            <div className="container">
                <div className="col">
                    <h1 className="title">VÄLJ EN KARAKTÄR</h1>

                    <div className="character-carousel">
                        <button className="ch-arrow" onClick={prev}>
                            <img src="/images/next.png" className="ch-arrow-img ch-arrow-img--flipped" />
                        </button>

                        <div className="characters">
                            <img key={character.id} src={character.image} alt={character.name}/>
                        </div>

                        <button className="ch-arrow" onClick={next}>
                            <img src="/images/next.png" className="ch-arrow-img" />
                        </button>
                    </div>
                    <button>
                        Redo
                    </button>
                </div>
            </div>
            
        </div>
    );
}