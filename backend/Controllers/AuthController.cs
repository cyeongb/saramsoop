using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ILogger<AuthController> _logger;
        private const string DevSecretKey = "dev-super-secret-key-for-development-only-123456789";

        public AuthController(ILogger<AuthController> logger)
        {
            _logger = logger;
        }

        // 🔥 개발용 로그인 엔드포인트
        [HttpPost("dev-login")]
        public IActionResult DevLogin([FromBody] DevLoginRequest request)
        {
            try
            {
                _logger.LogInformation($"🔐 개발용 로그인: {request.Role}");

                var token = GenerateDevToken(request.Role, request.Name ?? "개발자");

                return Ok(new
                {
                    token = token,
                    user = new
                    {
                        id = 1,
                        name = request.Name ?? "김관리",
                        role = request.Role,
                        email = "kim.admin@example.com",
                        empNo = "EMP001"
                    },
                    message = "개발용 로그인 성공"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "개발용 로그인 실패");
                return BadRequest(new { message = "로그인 실패", error = ex.Message });
            }
        }

        // 🔥 토큰 검증 엔드포인트
        [HttpGet("validate")]
        public IActionResult ValidateToken()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new { message = "토큰이 없습니다." });
            }

            return Ok(new
            {
                valid = true,
                token = token.Substring(0, Math.Min(20, token.Length)) + "...",
                message = "유효한 토큰입니다."
            });
        }

        private string GenerateDevToken(string role, string name)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(DevSecretKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, name),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("userId", "1"),
                    new Claim("empNo", "DEV001")
                }),
                Expires = DateTime.UtcNow.AddDays(7), // 7일 유효
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public class DevLoginRequest
    {
        public string Role { get; set; } = "Admin";
        public string? Name { get; set; }
    }
}