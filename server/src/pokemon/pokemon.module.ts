import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PokemonController } from './pokemon.controller';
import { pokemonProviders } from './pokemon.providers';
import { PokemonService } from './pokemon.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PokemonController],
  providers: [...pokemonProviders, PokemonService],
})
export class PokemonModule {}
