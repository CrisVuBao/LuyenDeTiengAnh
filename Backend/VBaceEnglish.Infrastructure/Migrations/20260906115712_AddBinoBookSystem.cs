using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VBaceEnglish.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBinoBookSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BinoBooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PdfFileUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EpubFileUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalChapters = table.Column<int>(type: "int", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BinoBooks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chapters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookId = table.Column<int>(type: "int", nullable: false),
                    ChapterNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chapters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chapters_BinoBooks_BookId",
                        column: x => x.BookId,
                        principalTable: "BinoBooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChapterBonuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChapterId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentHtml = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AudioUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SlangListJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChapterBonuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChapterBonuses_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DialogueLessons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChapterId = table.Column<int>(type: "int", nullable: false),
                    DialogueNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SituationDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VideoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AudioUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DurationSeconds = table.Column<int>(type: "int", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DialogueLessons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DialogueLessons_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DialogueLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DialogueLessonId = table.Column<int>(type: "int", nullable: false),
                    CharacterName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnglishText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VietnameseText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    AudioStartTimeMs = table.Column<int>(type: "int", nullable: true),
                    AudioEndTimeMs = table.Column<int>(type: "int", nullable: true),
                    IsUserRole = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DialogueLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DialogueLines_DialogueLessons_DialogueLessonId",
                        column: x => x.DialogueLessonId,
                        principalTable: "DialogueLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DialogueVocabularies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DialogueLessonId = table.Column<int>(type: "int", nullable: false),
                    Word = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Phonetic = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WordType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Meaning = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExampleSentence = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AudioPronunciationUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DialogueVocabularies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DialogueVocabularies_DialogueLessons_DialogueLessonId",
                        column: x => x.DialogueLessonId,
                        principalTable: "DialogueLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserDialogueProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DialogueLessonId = table.Column<int>(type: "int", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    HasWatchedVideo = table.Column<bool>(type: "bit", nullable: false),
                    RoleplayCompleted = table.Column<bool>(type: "bit", nullable: false),
                    DictationScore = table.Column<int>(type: "int", nullable: true),
                    TimeSpentSeconds = table.Column<int>(type: "int", nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDialogueProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDialogueProgresses_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserDialogueProgresses_DialogueLessons_DialogueLessonId",
                        column: x => x.DialogueLessonId,
                        principalTable: "DialogueLessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSRSReviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    VocabularyId = table.Column<int>(type: "int", nullable: false),
                    EaseFactor = table.Column<double>(type: "float", nullable: false),
                    IntervalDays = table.Column<int>(type: "int", nullable: false),
                    ConsecutiveCorrect = table.Column<int>(type: "int", nullable: false),
                    NextReviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewCount = table.Column<int>(type: "int", nullable: false),
                    LastReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSRSReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSRSReviews_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserSRSReviews_DialogueVocabularies_VocabularyId",
                        column: x => x.VocabularyId,
                        principalTable: "DialogueVocabularies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BinoBooks_Slug",
                table: "BinoBooks",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChapterBonuses_ChapterId",
                table: "ChapterBonuses",
                column: "ChapterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_BookId_ChapterNumber",
                table: "Chapters",
                columns: new[] { "BookId", "ChapterNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DialogueLessons_ChapterId_DialogueNumber",
                table: "DialogueLessons",
                columns: new[] { "ChapterId", "DialogueNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DialogueLines_DialogueLessonId_OrderIndex",
                table: "DialogueLines",
                columns: new[] { "DialogueLessonId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_DialogueVocabularies_DialogueLessonId_OrderIndex",
                table: "DialogueVocabularies",
                columns: new[] { "DialogueLessonId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_DialogueVocabularies_Word",
                table: "DialogueVocabularies",
                column: "Word");

            migrationBuilder.CreateIndex(
                name: "IX_UserDialogueProgresses_DialogueLessonId",
                table: "UserDialogueProgresses",
                column: "DialogueLessonId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDialogueProgresses_UserId_DialogueLessonId",
                table: "UserDialogueProgresses",
                columns: new[] { "UserId", "DialogueLessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSRSReviews_UserId_NextReviewDate",
                table: "UserSRSReviews",
                columns: new[] { "UserId", "NextReviewDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSRSReviews_UserId_VocabularyId",
                table: "UserSRSReviews",
                columns: new[] { "UserId", "VocabularyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSRSReviews_VocabularyId",
                table: "UserSRSReviews",
                column: "VocabularyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChapterBonuses");

            migrationBuilder.DropTable(
                name: "DialogueLines");

            migrationBuilder.DropTable(
                name: "UserDialogueProgresses");

            migrationBuilder.DropTable(
                name: "UserSRSReviews");

            migrationBuilder.DropTable(
                name: "DialogueVocabularies");

            migrationBuilder.DropTable(
                name: "DialogueLessons");

            migrationBuilder.DropTable(
                name: "Chapters");

            migrationBuilder.DropTable(
                name: "BinoBooks");
        }
    }
}
