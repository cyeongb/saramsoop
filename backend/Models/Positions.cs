// Models/Positions.cs
using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// 직급 정보 모델
    /// </summary>
    [Table("positions")]
    public class Position
    {
        /// <summary>
        /// 직급 ID (Primary Key)
        /// </summary>
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        /// <summary>
        /// 직급명
        /// </summary>
        [Required]
        [StringLength(50)]
        [Column("position_name")]
        public string PositionName { get; set; }

        /// <summary>
        /// 직급 레벨 (1:주임, 2:선임, 3:과장 등)
        /// </summary>
        [Required]
        [Column("position_level")]
        public int PositionLevel { get; set; }

        /// <summary>
        /// 부가 설명
        /// </summary>
        [StringLength(255)]
        [Column("description")]
        public string Description { get; set; }

        /// <summary>
        /// 생성 시간
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 수정 시간
        /// </summary>
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 네비게이션 프로퍼티
        /// <summary>
        /// 해당 직급의 직원 목록
        /// </summary>
        public virtual ICollection<EmployeeUser> EmployeeUsers { get; set; } = new List<EmployeeUser>();
    }
}