using Microsoft.AspNetCore.Mvc;
using WordMaster.Models;
using WordMaster.Services;

namespace WordMaster.Controllers;

[ApiController]
[Route("api/character")]
public class CharacterController : ControllerBase
{
    private readonly CharacterService _characterService;

    public CharacterController(CharacterService characterService)
    {
        _characterService = characterService;
    }

    //  GET /api/character 
    // Returns a list of all available characters.
    // Used by the lobby UI to populate the character selection screen.
    //
    // Response 200:
    // [
    //   {
    //     "id": "ugglan",
    //     "name": "Ugglan",
    //     "description": "The wise owl rewards long words.",
    //     "ability": {
    //       "type": "LongWordBonus",
    //       "bonusPoints": 3,
    //       "thresholdLength": 8,
    //       "effectDescription": "+3 bonus points for words longer than 8 letters"
    //     }
    //   },
    //   ...
    // ]
    [HttpGet]
    [ProducesResponseType(typeof(List<Character>), StatusCodes.Status200OK)]
    public IActionResult GetAll()
    {
        var characters = _characterService.GetAll();
        return Ok(characters);
    }

    // GET /api/character/{id}
    // Returns a single character by id (e.g. "ugglan", "leopard").
    // Used when you need to display a character's details or verify a selection.
    //
    // Response 200: { character object }
    // Response 404: { "error": "Character 'xyz' not found." }
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Character), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetById(string id)
    {
        var character = _characterService.GetById(id);

        if (character == null)
            return NotFound(new { error = $"Character '{id}' not found." });

        return Ok(character);
    }

    // POST /api/character/ability
    // Calculates how many bonus points a character earns for a specific word.
    // Call this after word validation succeeds, before recording the score.
    //
    // Request body:
    // {
    //   "characterId": "ugglan",
    //   "word": "katastrofal",
    //   "secondsTaken": 7.3
    // }
    //
    // Response 200:
    // {
    //   "characterId": "ugglan",
    //   "word": "katastrofal",
    //   "bonusPoints": 3,
    //   "abilityTriggered": true
    // }
    //
    // Response 404: character not found
    [HttpPost("ability")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult CalculateAbility([FromBody] AbilityRequest request)
    {
        var character = _characterService.GetById(request.CharacterId);

        if (character == null)
            return NotFound(new { error = $"Character '{request.CharacterId}' not found." });

        var bonus = _characterService.CalculateAbilityBonus(
            request.CharacterId,
            request.Word,
            request.SecondsTaken
        );

        return Ok(new
        {
            characterId      = request.CharacterId,
            word             = request.Word,
            bonusPoints      = bonus,
            abilityTriggered = bonus > 0
        });
    }

    // GET /api/character/{id}/freeze-immune 
    // Returns whether this character is immune to the Freeze chaos event.
    // The game loop calls this before applying a Freeze effect to a player.
    //
    // Response 200: { "characterId": "björnen", "isFreezeImmune": true }
    [HttpGet("{id}/freeze-immune")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult IsFreezeImmune(string id)
    {
        var character = _characterService.GetById(id);

        if (character == null)
            return NotFound(new { error = $"Character '{id}' not found." });

        return Ok(new
        {
            characterId    = id,
            isFreezeImmune = _characterService.IsFreezeImmune(id)
        });
    }
}

//  Request DTO

public class AbilityRequest
{
    public string CharacterId  { get; set; } = "";
    public string Word         { get; set; } = "";
    public double SecondsTaken { get; set; } = 0;
}