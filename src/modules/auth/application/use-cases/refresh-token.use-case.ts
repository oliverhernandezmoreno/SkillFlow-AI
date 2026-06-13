import type { TokenService } from '../../domain/services/token-service.js';
import type { TokenResponseDto } from '../dto/auth.dto.js';

export class RefreshTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(refreshToken: string): TokenResponseDto {
    return this.tokenService.refresh(refreshToken);
  }
}
