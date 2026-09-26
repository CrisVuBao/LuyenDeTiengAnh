using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VBaceEnglish.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('AspNetUsers', 'ApprovedAt') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [ApprovedAt] datetime2 NULL;
                END
                IF COL_LENGTH('AspNetUsers', 'IsApproved') IS NULL
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [IsApproved] bit NOT NULL CONSTRAINT [DF_AspNetUsers_IsApproved] DEFAULT 0;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "AspNetUsers");
        }
    }
}
