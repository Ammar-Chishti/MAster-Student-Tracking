<template>
  <v-row dense>
    <v-col cols="12">
      <v-card class="elevation-5">
        <v-card-title>
          Student Info
          <v-spacer></v-spacer>
          <div>
            <v-dialog v-model="dialog" max-width="70%">
              <template v-slot:activator="{ on, attrs }">
                <!-- EDIT INFO Button -->
                <v-btn
                  color="primary"
                  v-bind="attrs"
                  v-on="on"
                  @click="openDialog"
                  >Edit Info</v-btn
                >
              </template>
              <v-card>
                <v-card-title>
                  <span class="headline">Edit Info</span>
                </v-card-title>

                <!-- EDIT INFO dialog -->
                <v-card-text>
                  <v-container>
                    <v-form ref="form" onSubmit="return false;">
                      <v-row>
                        <v-col cols="6">
                          <v-text-field
                            v-model="newStudent.first_name"
                            :rules="[rules.required]"
                            label="First Name"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="newStudent.last_name"
                            :rules="[rules.required]"
                            label="Last Name"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="newStudent.email"
                            :rules="[
                              rules.required,
                              rules.isEmail,
                              rules.uniqueEmail,
                            ]"
                            label="Email"
                            :validate-on-blur="true"
                            :error-messages="warnUniqueEmail"
                            @focus="warnUniqueEmail = []"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="3">
                          <v-autocomplete
                            :items="[this.$store.state.loggedInUser.department]"
                            v-model="newStudent.department"
                            :rules="[rules.required]"
                            label="Department"
                            :clearable="true"
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="9">
                          <v-autocomplete
                            :items="getTracks()"
                            v-model="newStudent.track"
                            :rules="[rules.required, rules.track]"
                            label="Track"
                            :clearable="true"
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="3">
                          <v-autocomplete
                            :items="semesters"
                            v-model="newStudent.requirement_version_semester"
                            :rules="[rules.required]"
                            label="Version Semester"
                            :clearable="true"
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="3">
                          <v-text-field
                            v-model="newStudent.requirement_version_year"
                            :rules="[rules.required, rules.isYear]"
                            label="Version Year"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model="newStudent.advisor"
                            :rules="[]"
                            label="Faculty Advisor's Name (if applicable)"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="3">
                          <v-autocomplete
                            :items="semesters"
                            v-model="newStudent.entry_semester"
                            :rules="[rules.required]"
                            label="Entry Semester"
                            :clearable="true"
                            disabled
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="3">
                          <v-text-field
                            v-model="newStudent.entry_year"
                            :rules="[rules.required, rules.isYear]"
                            label="Entry Year"
                            disabled
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>

                        <v-col cols="3">
                          <v-autocomplete
                            :items="semesters"
                            v-model="newStudent.graduation_semester"
                            :rules="[rules.required]"
                            label="Graduation Semester"
                            :clearable="true"
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="3">
                          <v-text-field
                            v-model="newStudent.graduation_year"
                            :rules="[
                              rules.required,
                              rules.isYear,
                              rules.gradYear,
                            ]"
                            label="Graduation Year"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>

                        <!-- password edit (student only) -->
                        <v-col
                          cols="6"
                          v-show="!this.$store.state.loggedInUser.isGPD"
                        >
                          <v-text-field
                            :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                            :type="show1 ? 'text' : 'password'"
                            :rules="
                              this.$store.state.loggedInUser.isGPD
                                ? []
                                : [rules.min]
                            "
                            hint="At least 8 characters"
                            counter
                            @click:append="show1 = !show1"
                            v-model="newStudent.password"
                            label="New Password"
                            :disabled="this.$store.state.loggedInUser.isGPD"
                          ></v-text-field>
                        </v-col>
                        <!-- <v-col
                          cols="6"
                          v-show="!this.$store.state.loggedInUser.isGPD"
                        >
                          <v-text-field
                            :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                            :type="show2 ? 'text' : 'password'"
                            :rules="
                              this.$store.state.loggedInUser.isGPD
                                ? []
                                : [
                                    rules.min,
                                    rules.passwordMatch,
                                  ]
                            "
                            hint="At least 8 characters"
                            counter
                            @click:append="show2 = !show2"
                            v-model="newStudent.password_confirm"
                            label="Confirm Password"
                          ></v-text-field>
                        </v-col> -->
                      </v-row>
                      <span style="color: red" :hidden="hidden">
                        Student info was edited by someone else, click reload to
                        update
                      </span>
                    </v-form>
                  </v-container>
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="blue darken-1"
                    text
                    @click="closeDialog"
                    v-show="hidden"
                    >Cancel</v-btn
                  >
                  <v-btn color="blue darken-1" text @click="submit">{{
                    this.hidden ? "Submit" : "Reload"
                  }}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
          <v-spacer></v-spacer>

          <v-btn
            width="200"
            dark
            @click="showDegreeStatus = !showDegreeStatus"
            >{{
              this.showDegreeStatus ? "Show Summary" : "Show Degree Status"
            }}</v-btn
          >
        </v-card-title>

        <!-- STUDENT INFO data table -->
        <v-data-table
          :headers="this.showDegreeStatus ? headers2 : headers"
          :items="students"
          :loading="loading"
          :hide-default-footer="true"
          disable-pagination
          dense
          :item-class="getClass2"
        >
        </v-data-table>
      </v-card>
    </v-col>

    <v-col lg="7" sm="12">
      <v-card class="elevation-5">
        <v-card-title>
          Current Course Plan
          <v-spacer></v-spacer>
          <div>
            <v-dialog v-model="dialog3" max-width="60%">
              <template v-slot:activator="{ on, attrs }">
                <!-- ADD COURSE BUTTON -->
                <v-btn
                  :disabled="addCourseDisabled"
                  color="primary"
                  v-bind="attrs"
                  v-on="on"
                  @click="openDialog3"
                  >Add Course</v-btn
                >
              </template>
              <v-card>
                <v-card-title>
                  <span class="headline"> {{ formTitle }} </span>
                </v-card-title>

                <!-- ADD COURSE DIALOG -->
                <v-card-text>
                  <v-container>
                    <v-form ref="form" onSubmit="return false;">
                      <v-row v-show="!editDisabled">
                        <v-col>
                          <v-checkbox
                            v-model="checkboxWaive"
                            label="Waive Prerequisites"
                            hide-details
                          ></v-checkbox>
                        </v-col>
                        <v-col>
                          <v-checkbox
                            v-model="checkboxTransfer"
                            label="Add Transfer Credits"
                            hide-details
                          ></v-checkbox>
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col cols="4">
                          <v-text-field
                            v-model="newCourse.department"
                            :rules="checkboxTransfer ? [] : [rules.required]"
                            label="Department"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="4">
                          <v-text-field
                            v-model="newCourse.course_num"
                            :rules="
                              checkboxTransfer
                                ? []
                                : [rules.required, rules.course_num]
                            "
                            label="Number"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="4" v-show="!checkboxTransfer">
                          <v-text-field
                            v-model="newCourse.section"
                            :rules="checkboxTransfer ? [] : [rules.required]"
                            label="Section"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="4" v-show="!checkboxTransfer">
                          <v-autocomplete
                            :items="semesters"
                            v-model="newCourse.semester"
                            :rules="checkboxTransfer ? [] : [rules.required]"
                            label="Semester"
                            :clearable="true"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="4" v-show="!checkboxTransfer">
                          <v-text-field
                            v-model="newCourse.year"
                            :rules="
                              checkboxTransfer
                                ? []
                                : [rules.required, rules.isYear]
                            "
                            label="Year"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="4" v-show="checkboxTransfer">
                          <v-text-field
                            v-model="newCourse.credits"
                            type="number"
                            :rules="
                              checkboxTransfer
                                ? [rules.required, rules.credits]
                                : []
                            "
                            label="Credits"
                            :validate-on-blur="true"
                            :disabled="editDisabled"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="4" v-show="checkboxTransfer"> </v-col>
                        <v-col cols="4" v-show="checkboxTransfer"> </v-col>
                        <v-col cols="4">
                          <v-autocomplete
                            :items="!checkboxTransfer ? grades : grades2"
                            v-model="newCourse.grade"
                            :rules="
                              editDisabled || checkboxTransfer
                                ? [rules.required]
                                : []
                            "
                            label="Grade"
                            :clearable="true"
                            :disabled="
                              this.$store.state.loggedInUser.isGPD !== true
                            "
                            :validate-on-blur="true"
                          ></v-autocomplete>
                        </v-col>
                        <v-col
                          cols="6"
                          v-show="
                            this.newCourse.department === 'CSE' &&
                            this.newCourse.course_num === '587' &&
                            !checkboxTransfer
                          "
                        >
                          <!-- <v-col cols="6" v-show="handleCSE587 && !checkboxTransfer"> -->
                          <v-text-field
                            v-model="newCourse.cse587_course_num"
                            placeholder="310"
                            :rules="
                              this.newCourse.department === 'CSE' &&
                              this.newCourse.course_num === '587'
                                ? [rules.required, rules.proficiency_course_num]
                                : []
                            "
                            label="Co-Scheduled Course Number"
                            :disabled="editDisabled"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                      <span style="color: red" :hidden="!coursePlanAddError">
                        Failed to add course plan entry
                      </span>
                    </v-form>
                  </v-container>
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="blue darken-1" text @click="closeDialog3"
                    >Cancel</v-btn
                  >
                  <v-btn
                    :disabled="disableAddCourseSubmit"
                    color="blue darken-1"
                    text
                    @click="submit3"
                    >Submit</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </v-card-title>

        <!-- CURRENT COURSE PLAN data table-->
        <v-data-table
          :headers="ccp_table_headers"
          :items="currentCoursePlan"
          :hide-default-footer="true"
          disable-pagination
          :loading="loading2"
          dense
          item-key="course_plan_id"
          must-sort
          sort-by="SemesterYear"
          @click:row="handleClick2"
          :item-class="getClass"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon
              small
              v-show="showEdit && !pendingApproval"
              class="mr-2"
              @click="editEntry(item)"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              small
              v-show="pendingApproval || item.grade === '' || item.validity === 0"
              @click="deleteEntry(item)"
            >
              mdi-delete
            </v-icon>
            <v-icon
              small
              v-show="item.pendingApproval"
              @click="approveEntry(item)"
            >
              mdi-check-bold
            </v-icon>
          </template>
          <!-- <template slot="item-class">
            <tr class="warning">
              <td></td>
              </tr>
          </template> -->
        </v-data-table>
        <v-card
          v-show="this.$store.state.loggedInUser.isGPD && showInvalidNotify"
          class="elevation-0"
        >
          <v-container v-show="true">
            <v-row align="center" justify="center">
              <v-col align="center">
                <v-btn
                  text
                  color="primary"
                  @click="
                    showInvalidNotify =
                      !showInvalidNotify && notifyInvalidPlan()
                  "
                  >Notify Invalid Plan</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-card>
    </v-col>

    <v-col lg="5" sm="12">
      <v-row dense>
        <v-col cols="12">
          <!-- COMMENTS data table -->
          <v-card class="elevation-5">
            <v-card-title>
              Comments

              <v-spacer></v-spacer>
            </v-card-title>
            <v-data-table
              :headers="comment_table_headers"
              :items="comments"
              :loading="loading3"
              :hide-default-footer="true"
              disable-pagination
              dense
              show-select
              item-key="id"
              v-model="selected"
              @click:row="handleClick"
            >
            </v-data-table>
            <v-divider></v-divider>

            <v-container v-show="showCommentButtons">
              <v-row align="center" justify="center">
                <v-col xs="12" align="center">
                  <v-dialog v-model="dialog2" max-width="40%">
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        color="primary"
                        v-bind="attrs"
                        v-on="on"
                        @click="openDialog2"
                        >New Comment</v-btn
                      >
                    </template>
                    <v-card>
                      <v-card-title>
                        <span class="headline">New Comment</span>
                      </v-card-title>

                      <v-card-text>
                        <v-container>
                          <v-form ref="form" onSubmit="return false;">
                            <v-row>
                              <v-col cols="12">
                                <v-text-field
                                  v-model="newComment"
                                  :rules="[rules.required]"
                                  label="Comment"
                                  :validate-on-blur="true"
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12">
                                <v-checkbox
                                  v-model="checkboxEmail"
                                  label="Notify student by email"
                                  hide-details
                                ></v-checkbox>
                              </v-col>
                            </v-row>
                          </v-form>
                        </v-container>
                      </v-card-text>

                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" text @click="closeDialog2"
                          >Cancel</v-btn
                        >
                        <v-btn color="blue darken-1" text @click="submit2"
                          >Submit</v-btn
                        >
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-col>
                <v-col xs="12" align="center">
                  <v-btn
                    class="error"
                    color="primary"
                    dark
                    @click="deleteSelected()"
                    >Deleted Selected</v-btn
                  >
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>


<script>
import { mapState } from "vuex";
import APIService from "../APIService";
import SuggestCoursePlan from "./SuggestCoursePlan.vue";

export default {
  components: { SuggestCoursePlan },
  data() {
    return {
      students: [],
      loading: true,
      loading2: true,
      loading3: true,
      showEdit: this.$store.state.loggedInUser.isGPD,
      headers: [
        { text: "SBU ID", value: "sbu_id" },
        { text: "First Name", value: "first_name" },
        { text: "Last Name", value: "last_name" },
        { text: "Email", value: "email" },
        { text: "Entry Sem.", value: "entry_semester" },
        { text: "Entry Year", value: "entry_year" },
        { text: "Department", value: "department" },
        { text: "Track", value: "track" },
        { text: "Graduation Sem.", value: "graduation_semester" },
        { text: "Graduation Year", value: "graduation_year" },
      ],
      headers2: [
        // headers for data table that shows all students IN SHOW DEGREE STATUS VIEW
        { text: "SBU ID", value: "sbu_id" },
        { text: "First Name", value: "first_name" },
        { text: "Last Name", value: "last_name" },
        { text: "Department", value: "department" },
        { text: "Track", value: "track" },
        { text: "Requirements Status", value: "requirementsStatus" },
        { text: "# Satisfied", value: "satisfied" },
        { text: "# Pending", value: "pending" },
        { text: "# Unsatisfied", value: "unsatisfied" },
        { text: "Course Plan Status", value: "coursePlanStatus" },
      ],
      showDegreeStatus: false, // toggle between headers and headers2

      newStudent: {},
      dialog: false,
      dialog2: false,
      dialog3: false,
      hidden: true,
      warnUniqueEmail: [],
      majors: ["AMS", "BMI", "CSE", "ESE"],
      semesters: ["Winter", "Spring", "SummerI", "SummerII", "Fall"],
      grades: [
        "A",
        "A-",
        "B+",
        "B",
        "B-",
        "C+",
        "C",
        "C-",
        "D+",
        "D",
        "F",
        "T",
        "I",
        "NC",
        "NR",
        "P",
        "Q",
        "R",
        "S",
        "U",
        "W",
      ],
      grades2: ["A", "A-", "B+", "B"],
      show1: false,
      show2: false,
      rules: {
        required: (v) => !!v || "Required field",
        min: (v) => !v || (!!v && v.length >= 8) || "Min 8 characters",
        passwordMatch: () =>
          this.newStudent.password === this.newStudent.password_confirm ||
          "Passwords don't match",
        isEmail: (v) => /.+@.+\..+/.test(v) || "Enter a vaild email",
        uniqueEmail: () => true, // TODO?
        isYear: (v) => (v >= 1901 && v <= 2155) || "Enter a vaild year",
        gradYear: () =>
          this.newStudent.graduation_year > this.newStudent.entry_year ||
          (this.newStudent.graduation_year === this.newStudent.entry_year &&
            this.semesters.indexOf(this.newStudent.graduation_semester) >=
              this.semesters.indexOf(this.newStudent.entry_semester)) ||
          "Graduation cannot be before entry",
        track: (v) => this.getTracks().indexOf(v) >= 0 || "Invalid track",
        credits: (v) => (v > 0 && v <= 12) || "Invalid number of credits",
        course_num: (v) => /^[5-9][0-9]{2}$/.test(v) || "Invalid course number",
        proficiency_course_num: (v) =>
          /^[1-4][0-9]{2}$/.test(v) || "Invalid course number",
      },

      ccp_table_headers: [
        { text: "Department", value: "department" },
        { text: "Course Num", value: "course_num" },
        { text: "Section", value: "section" },
        {
          text: "Semester",
          value: "SemesterYear",
          sort: function (a, b) {
            // if (a === "Transfer Credit") {
            //   return -1;
            // }
            a = a.split(" ");
            b = b.split(" ");
            return (
              a[1] - b[1] ||
              ["Winter", "Spring", "SummerI", "SummerII", "Fall"].indexOf(
                a[0]
              ) -
                ["Winter", "Spring", "SummerI", "SummerII", "Fall"].indexOf(
                  b[0]
                )
            );
          },
        },
        // { text: "Year", value: "year" },
        { text: "Grade", value: "grade" },
        { text: "Actions", value: "actions" },
      ],
      formTitle: "",
      currentCoursePlan: [],
      newCourse: {},
      editDisabled: false,
      selectedCoursePlanItem: {},
      checkboxWaive: false,
      checkboxTransfer: false,
      handleCSE587: false,
      coursePlanAddError: false,
      disableAddCourseSubmit: false,
      showInvalidNotify: false,
      addCourseDisabled: false,

      comment_table_headers: [
        { text: "Comment", value: "text" },
        { text: "Date", value: "date" },
        // { text: "Actions", value: "actions" },
      ],
      checkboxEmail: false,
      selected: [], // comments
      selected2: [], // course plan
      comments: [],
      showCommentButtons: false,
      newComment: "",
    };
  },
  async created() {
    if (
      this.$store.state.selectedID === "N/A" &&
      this.$store.state.loggedInUser.isGPD
    ) {
      this.$router.push("gpdhomepage");
      return;
    }

    let s = await APIService.get(
      "/api/student" +
        "?sbu_id=" +
        this.$store.state.selectedID +
        "&associate=true"
    );
    s = s[0];

    // let degreeStatus = await APIService.get(
    //   "/api/student/degreestatus/" + this.$store.state.selectedID
    // );
    // console.log(degreeStatus);
    // s.requirementsStatus = degreeStatus.requirementsStatus;

    if (s.graduated) {
      this.ccp_table_headers.pop();
      this.addCourseDisabled = true;
    }

    s.first_name = s.User.first_name;
    s.last_name = s.User.last_name;
    s.email = s.User.email;
    this.students = [s];
    this.loading = false;

    this.updateCoursePlanTable();

    // console.log(this.student.comments);
    try {
      this.comments = await JSON.parse(this.student.comments);
    } catch {
      this.comments = [];
    }
    this.showCommentButtons = this.$store.state.loggedInUser.isGPD;
    this.loading3 = false; // after loading comments from database
  },
  methods: {
    async updateCoursePlanTable() {
      // get all "course plan" entries associated with this student
      let coursePlans = await APIService.get(
        "/api/student/courseplan/" + this.$store.state.student.sbu_id
      );
      this.currentCoursePlan = coursePlans;

      if (this.currentCoursePlan.filter((v) => v.validity === 0).length > 0) {
        this.showInvalidNotify = true;
      } else {
        this.showInvalidNotify = false;
      }

      this.loading2 = false;
    },
    async addComment() {
      // console.log("ADD COMMENT BUTTON");

      let d = new Date();
      let commentDate =
        String(d.getMonth() + 1) +
        "/" +
        String(d.getDate()) +
        "/" +
        String(d.getFullYear());
      let newCommentObject = {
        id: Math.ceil(Math.random() * 1000),
        text: this.newComment,
        date: commentDate,
      };
      // console.log(newCommentObject);

      this.comments.push(newCommentObject);

      // write to database
      let commentsStr = JSON.stringify(this.comments);
      this.student.comments = commentsStr;
      await APIService.put("/api/student/comment/" + this.student.sbu_id, {
        comments: commentsStr,
        sendEmail: this.checkboxEmail,
        newComment: this.newComment,
      });

      this.newComment = "";
    },

    async editEntry(item) {
      this.formTitle = "Edit Grade";
      this.editDisabled = true;
      this.coursePlanAddError = false;
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }
      this.checkboxTransfer = item.transfer;

      this.newCourse = Object.assign({}, item);
      this.selectedCoursePlanItem = item;

      this.handleCSE587 =
        this.newCourse.department === "CSE" &&
        this.newCourse.course_num === "587";

      this.dialog3 = true;
    },

    async deleteEntry(item) {
      let res = await APIService.delete(
        "/api/courseplan/" + item.course_plan_id
      );
      if (res.status === 200) {
        await this.updateCoursePlanTable();
      }
    },

    async approveEntry(item) {
      item.pendingApproval = false;
   let res = await APIService.put(
        "/api/courseplan/" + item.course_plan_id, item
      );
      if (res.status === 200) {
        await this.updateCoursePlanTable();
      }


    },

    async deleteSelected() {
      // console.log(this.selected);
      for (let c of this.selected) {
        const index = this.comments.indexOf(c);
        this.comments.splice(index, 1);
      }
      // write to database
      let commentsStr = JSON.stringify(this.comments);
      this.student.comments = commentsStr;
      await APIService.put("/api/student/comment/" + this.student.sbu_id, {
        comments: commentsStr,
      });
      this.selected = [];
    },

    async handleClick(row) {
      const index = this.selected.indexOf(row);
      if (index >= 0) {
        this.selected.splice(index, 1);
      } else {
        this.selected.push(row);
      }
    },

    async handleClick2(row) {
      if (this.selected2[0] === row) {
        this.selected2 = [];
      } else {
        this.selected2 = [row];
      }
    },

    getTracks() {
      switch (this.newStudent.department) {
        case "AMS":
          return [
            "Computational Applied Mathematics",
            "Computational Biology",
            "Operations Research",
            "Quantitative Finance",
            "Statistics",
          ];
        case "BMI":
          return [
            "Imaging Informatics with thesis",
            "Imaging Informatics with project",
            "Clinical Informatics with thesis",
            "Clinical Informatics with project",
            "Translational Bioinformatics with thesis",
            "Translational Bioinformatics with project",
          ];
        case "CSE":
          return ["Special project", "Advanced project", "Thesis"];
        case "ESE":
          return ["Non-thesis", "Thesis"];
        default:
          return [];
      }
    },

    openDialog() {
      this.newStudent = Object.assign({}, this.students[0]);
      this.dialog = true;
      this.$nextTick(() => {
        this.$refs.form.resetValidation();
      });
    },

    closeDialog() {
      this.dialog = false;
    },

    openDialog2() {
      this.dialog2 = true;
      this.$nextTick(() => {
        this.$refs.form.reset();
      });
    },

    closeDialog2() {
      this.dialog2 = false;
    },

    openDialog3() {
      this.formTitle = "Add Course";
      this.coursePlanAddError = false;
      this.editDisabled = false;
      this.newCourse = {};
      this.dialog3 = true;
      this.$nextTick(() => {
        this.$refs.form.reset();
      });
    },

    closeDialog3() {
      this.dialog3 = false;
    },

    async submit2() {
      if (!this.$refs.form.validate()) {
        return;
      }

      this.addComment();
      this.closeDialog2();
    },

    // handle add/edit course plan entry
    async submit3() {
      if (!this.$refs.form.validate()) {
        return;
      }

      this.disableAddCourseSubmit = true;

      if (this.newCourse.grade === null) {
        this.newCourse.grade = "";
      }

      if (this.checkboxTransfer) {
        this.newCourse.transfer = true;
      } else {
        this.newCourse.transfer = false;
      }

      if (this.checkboxWaive) {
        this.newCourse.waived = "waived";
      } else {
        this.newCourse.waived = "";
      }

      let result;
      if (this.editDisabled) {
        // edit grade
        result = await APIService.put(
          "/api/courseplan/" + this.newCourse.course_plan_id,
          this.newCourse
        );
        // this.selectedCoursePlanItem.grade = this.newCourse.grade;
      } else {
        // new entry
        this.newCourse.sbu_id = this.$store.state.selectedID;
        result = await APIService.post("/api/courseplan", this.newCourse);
      }

      if (result.status !== 200) {
        this.coursePlanAddError = true;
      } else {
        this.coursePlanAddError = false;
        this.dialog3 = false;
        await this.updateCoursePlanTable();
      }

      this.disableAddCourseSubmit = false;
    },

    async submit() {
      // handle timestamp mismatched
      if (!this.hidden) {
        let s = await APIService.get(
          "/api/student/" + this.$store.state.selectedID + "?associate=true"
        );

        s.first_name = s.User.first_name;
        s.last_name = s.User.last_name;
        s.email = s.User.email;
        this.students = [s];
        this.hidden = true;
        this.dialog = false;
        return;
      }

      if (!this.$refs.form.validate()) {
        return;
      }

      let res = await APIService.put(
        "/api/student/" + this.newStudent.sbu_id,
        this.newStudent
      );
      if (res.status === 200) {
        this.$store.state.student = await APIService.get(
          "/api/student/" + this.newStudent.sbu_id + "?associate=true"
        );
        if (!this.$store.state.loggedInUser.isGPD) {
          this.$store.state.loggedInUser = await APIService.get(
            "/api/user/" + this.newStudent.sbu_id
          );
        }
        let s = this.$store.state.student;
        s.first_name = s.User.first_name;
        s.last_name = s.User.last_name;
        s.email = s.User.email;
        this.students = [s];
        this.dialog = false;
      } else if (res.status === 403) {
        // timestamp mismatch
        this.hidden = false;
      } else {
        // editing failed on database side
        let res = await APIService.post("/api/uniqueEmail", {
          email: this.newStudent.email,
        });
        if (res.status !== 200) {
          this.warnUniqueEmail = ["Email is already in use"];
          return;
        }
      }
    },
    getClass(item) {
      // console.log(item);
      if (item.transfer) {
        const myClass = "transfer";
        return myClass;
      } else if (item.validity === 0) {
        const myClass = "invalid";
        return myClass;
      } else if (item.validity === 1) {
        const myClass = "valid";
        return myClass;
      } else {
        const myClass = "unknown";
        return myClass;
      }
    },
    getClass2(item) {
      // console.log(item);
      if (item.pendingApproval) {
        return;
      }
      if (item.requirementsStatus === "Graduated") {
        const myClass = "graduated";
        return myClass;
      } else if (item.requirementsStatus == "Unsatisfied") {
        const myClass = "unsatisfied";
        return myClass;
      } else if (item.requirementsStatus == "Pending") {
        const myClass = "pending";
        return myClass;
      } else if (item.requirementsStatus == "Satisfied") {
        const myClass = "satisfied";
        return myClass;
      }
    },
    async notifyInvalidPlan() {
      let body = {};
      body.message =
        "Notification from GPD: an entry in your course plan is invalid.";
      body.address = this.students[0].email;
      APIService.post("/api/notifyInvalidPlan", body);
    },
  },
  computed: {
    ...mapState(["loggedInUser", "student"]),
  },
};
</script>
<style lang="css">
.graduated td {
  background-color: rgba(0, 255, 0, 0.3);
}
.unsatisfied td {
  background-color: rgba(255, 0, 0, 0.1);
}
.satisfied td {
  background-color: rgba(0, 255, 0, 0.1);
}
.pending td {
  background-color: rgba(255, 255, 0, 0.1);
}
.invalid td {
  background-color: rgba(255, 0, 0, 0.1);
}
.valid td {
  background-color: rgba(0, 255, 0, 0.1);
}
.unknown td {
  background-color: rgba(255, 255, 0, 0.1);
}
.transfer td {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
