import { Test, TestingModule } from '@nestjs/testing';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';

const testPokemonArray = [
  {
    id: 1,
    name: 'Bulbasaur',
  },
  {
    id: 4,
    name: 'Charmander',
  },
  {
    id: 7,
    name: 'Squirtle',
  },
];

describe('Pokemon Controller', () => {
  let controller: PokemonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokemonController],
      providers: [
        {
          provide: PokemonService,
          useValue: {
            create: jest.fn((pokemon: CreatePokemonDto) => Promise.resolve(pokemon)),
            findAll: jest.fn().mockResolvedValue(testPokemonArray),
            findOne: jest.fn((id: number) => {
              return testPokemonArray.find((pokemon) => pokemon.id === id);
            }),
            update: jest.fn((id: number, pokemon: UpdatePokemonDto) => Promise.resolve(pokemon)),
          },
        },
      ],
    }).compile();

    controller = module.get<PokemonController>(PokemonController);
  });

  describe('create', () => {
    it('should create a pokemon', async () => {
      const createPokemonDto: CreatePokemonDto = { id: 25, name: 'Pikachu' };
      await expect(controller.create(createPokemonDto)).resolves.toEqual(createPokemonDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of pokemon', async () => {
      await expect(controller.findAll()).resolves.toEqual(testPokemonArray);
    });
  });

  describe('findOne', () => {
    it('should return a pokemon', async () => {
      await expect(controller.findOne('1')).resolves.toEqual(testPokemonArray[0]);
    });
  });

  describe('update', () => {
    it('should update a pokemon', async () => {
      const updatePokemonDto: UpdatePokemonDto = { id: 1, name: 'Pikachu' };
      await expect(controller.update('1', updatePokemonDto)).resolves.toEqual(updatePokemonDto);
    });
  });
});
