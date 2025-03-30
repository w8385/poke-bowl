import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @Inject('POKEMON_REPOSITORY')
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    return this.pokemonRepository.save(createPokemonDto);
  }

  async findAll(): Promise<Pokemon[]> {
    return this.pokemonRepository.find();
  }

  async findOne(id: number): Promise<Pokemon> {
    return this.pokemonRepository.findOneByOrFail({ id });
  }

  async update(id: number, updatePokemonDto: UpdatePokemonDto): Promise<Pokemon> {
    await this.pokemonRepository.update({ id }, updatePokemonDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.pokemonRepository.delete({ id });
  }
}
