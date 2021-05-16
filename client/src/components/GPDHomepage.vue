<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-card-title>
          Search for Students
          <v-spacer></v-spacer>

          <!-- SEARCH FOR STUDENTS search bar -->
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search any field"
            single-line
            hide-details
          ></v-text-field>

          <!-- SHOW DEGREE STATUS button -> see down below for extra headers for table -->
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

        <!-- Data table of students -->
        <v-data-table
          :headers="this.showDegreeStatus ? headers2 : headers"
          :items="students"
          :search="search"
          :custom-filter="customFilter"
          :loading="loading"
          :hide-default-footer="false"
          show-select
          single-select
          v-model="selected"
          item-key="sbu_id"
          dense
          must-sort
          :item-class="getClass"
          @click:row="handleClick"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [5, 10, 15, 20],
          }"
        >
        </v-data-table>

        <!-- VIEW SELECTED STUDENT, lets GPD view info for any student they want -->
        <v-container>
          <v-row align="center" justify="center">
            <v-col lg="4" md="6" sm="12" align="center">
              <v-btn color="primary" dark @click="select()"
                >View Selected Student
                <v-icon right>mdi-account</v-icon>
              </v-btn>
            </v-col>

            <!-- ADD NEW STUDENT button -->
            <v-col lg="4" md="6" sm="12" align="center">
              <v-dialog v-model="dialog" max-width="70%">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                    @click="openDialog"
                    >Add New Student
                    <v-icon right>mdi-account-plus</v-icon></v-btn
                  >
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline">Add Student</span>
                  </v-card-title>

                  <!-- ADD NEW STUDENT DIALOG -->
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
                              :items="[
                                this.$store.state.loggedInUser.department,
                              ]"
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
                              :validate-on-blur="true"
                            ></v-autocomplete>
                          </v-col>
                          <v-col cols="3">
                            <v-text-field
                              v-model="newStudent.entry_year"
                              :rules="[rules.required, rules.isYear]"
                              label="Entry Year"
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

                          <!-- <v-col cols="6">
                            <v-text-field
                              :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                              :type="show1 ? 'text' : 'password'"
                              :rules="[rules.required, rules.min]"
                              hint="At least 8 characters"
                              counter
                              @click:append="show1 = !show1"
                              v-model="newStudent.password"
                              label="Password"
                              :validate-on-blur="true"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                              :type="show2 ? 'text' : 'password'"
                              :rules="[rules.passwordMatch]"
                              counter
                              @click:append="show2 = !show2"
                              v-model="newStudent.password_confirm"
                              label="Confirm Password"
                            ></v-text-field>
                          </v-col> -->
                        </v-row>
                      </v-form>
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog"
                      >Cancel</v-btn
                    >
                    <v-btn
                      color="blue darken-1"
                      text
                      @click="submit"
                      :disabled="this.disabled"
                      >Submit</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>

            <!-- DELETE ALL STUDENTS button -->
            <v-col lg="4" md="12" sm="12" align="center">
              <v-dialog v-model="dialog2" max-width="30%">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    id="deleteButton"
                    class="error"
                    v-bind="attrs"
                    v-on="on"
                    @click="openDialog2"
                    >Delete All Students <v-icon right>mdi-alert</v-icon></v-btn
                  >
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline">Confirm Deletion</span>
                  </v-card-title>

                  <v-card-text>
                    <v-form ref="form" onSubmit="return false;">
                      <v-row>
                        <v-col cols="12">
                          <v-text-field
                            v-model="confirmDeletion"
                            :rules="[rules.deleteConfirm]"
                            label="Type 'delete' to confirm deletion"
                            :validate-on-blur="true"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-form>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog2"
                      >Cancel</v-btn
                    >
                    <v-btn
                      color="blue darken-1"
                      text
                      @click="submit2"
                      :disabled="this.disabled2"
                      >Submit</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../APIService";

export default {
  data() {
    return {
      students: [],
      search: "",
      selected: [],
      loading: true,
      headers: [
        // headers for data table that shows all students
        { text: "SBU ID", value: "sbu_id" },
        { text: "First Name", value: "first_name" },
        { text: "Last Name", value: "last_name" },
        { text: "Email", value: "email" },
        { text: "Department", value: "department" },
        { text: "Track", value: "track" },
        {
          text: "Entry",
          value: "entry",
          sort: function (a, b) {
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
        {
          text: "Graduation",
          value: "graduation",
          sort: function (a, b) {
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
        // { text: "Graduation Sem.", value: "graduation_semester" },
        // { text: "Graduation Year", value: "graduation_year" },
      ],
      headers2: [
        // headers for data table that shows all students IN SHOW DEGREE STATUS VIEW
        { text: "First Name", value: "first_name" },
        { text: "Last Name", value: "last_name" },
        { text: "Department", value: "department" },
        { text: "Track", value: "track" },
        { text: "Version", value: "version" },
        { text: "Requirements Status", value: "requirementsStatus" },
        { text: "# Satisfied", value: "satisfied" },
        { text: "# Pending", value: "pending" },
        { text: "# Unsatisfied", value: "unsatisfied" },
        { text: "Course Plan Status", value: "coursePlanStatus" },
      ],
      showDegreeStatus: false, // toggle between headers and headers2

      newStudent: {},
      dialog: false,
      confirmDeletion: "",
      dialog2: false,
      disabled: false,
      disabled2: false,
      warnUniqueEmail: [],
      majors: ["AMS", "BMI", "CSE", "ESE"],
      semesters: ["Winter", "Spring", "SummerI", "SummerII", "Fall"],
      show1: false,
      show2: false,
      rules: {
        // verification rules for adding a new student, making sure email is valid, entry year is valid, etc
        required: (v) => !!v || "Required field",
        min: (v) => (!!v && v.length >= 8) || "Min 8 characters",
        passwordMatch: () =>
          this.newStudent.password === this.newStudent.password_confirm ||
          "Passwords don't match",
        isEmail: (v) => /.+@.+\..+/.test(v) || "Enter a vaild email",
        uniqueEmail: () => true,
        isYear: (v) => (v >= 1901 && v <= 2155) || "Enter a vaild year",
        gradYear: () =>
          this.newStudent.graduation_year > this.newStudent.entry_year ||
          (this.newStudent.graduation_year === this.newStudent.entry_year &&
            this.semesters.indexOf(this.newStudent.graduation_semester) >=
              this.semesters.indexOf(this.newStudent.entry_semester)) ||
          "Graduation cannot be before entry",
        track: (v) => this.getTracks().indexOf(v) >= 0 || "Invalid track",
        deleteConfirm: (v) =>
          v === null ? "" : v.toLowerCase() === "delete" || "",
      },
    };
  },

  async created() {
    if (!this.$store.state.loggedInUser.isGPD) {
      this.$router.push("studenthomepage");
      return;
    }
    await this.updateTable();
    this.loading = false;
  },

  methods: {
    async updateTable() {
      // fetches table from database + formats it in correct JSON way
      let departmentStr =
        this.$store.state.loggedInUser.department === "ALL"
          ? ""
          : "&department=" + this.$store.state.loggedInUser.department;
      let allStudents = await APIService.get(
        "/api/student" + "?associate=true" + departmentStr
      );
      for (let s of allStudents) {
        s.first_name = s.User.first_name;
        s.last_name = s.User.last_name;
        s.email = s.User.email;
        s.entry = s.entry_semester + " " + s.entry_year;
        s.graduation = s.graduation_semester + " " + s.graduation_year;
        s.version =
          s.requirement_version_semester + " " + s.requirement_version_year;
      }
      allStudents.sort(function (a, b) {
        return parseInt(a.sbu_id) - parseInt(b.sbu_id);
      });
      this.students = allStudents;
    },

    customFilter(value, search, item) {
      // enhances search capabilities, does an AND operation on everything separated by commas
      if (value === null || search === null || typeof value !== "string") {
        return false;
      }

      let split = search.toLowerCase().split(",");
      for (let s of split) {
        let found = false;
        for (let h of this.headers.concat(this.headers2)) {
          if (item[h.value] === undefined) {
            continue;
          }
          if (item[h.value].toString().toLowerCase().includes(s.trim())) {
            found = true;
            break;
          }
        }
        if (found === true) {
          continue;
        } else {
          return false;
        }
        // if (value.toString().toLowerCase().includes(s.trim()) && s.trim() !== '') {
        //   return true;
        // }
      }

      return true;
    },

    async deleteAll() {
      await APIService.delete("/api/student");
      this.students = [];
      this.$store.state.student = {};
      this.$store.state.selectedID = "N/A";
    },

    async handleClick(row) {
      if (this.selected[0] === row) {
        this.selected = [];
      } else {
        this.selected = [row];
      }
    },

    async select() {
      // what gets triggered on VIEW SELECTED STUDENT
      if (this.selected[0] === undefined) {
        return;
      }
      let selectedID = this.selected[0].sbu_id;
      let result = await APIService.getOne(
        "/api/student/" + selectedID + "?associate=true"
      );
      if (result.sbu_id === undefined) {
        return;
      } else {
        this.$store.state.selectedID = selectedID;
        this.$store.state.student = result;
        this.$router.push("studenthomepage");
      }
    },

    getTracks() {
      // gets all tracks for department
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

    toggleDegreeStatus() {
      this.showDegreeStatus = !this.showDegreeStatus;
    },

    openDialog() {
      this.disabled = false;
      this.dialog = true;
      this.$nextTick(() => {
        this.$refs.form.reset();
        this.warnUniqueEmail = [];
      });
    },

    closeDialog() {
      this.dialog = false;
    },

    openDialog2() {
      this.disabled2 = false;
      this.dialog2 = true;
      this.$nextTick(() => {
        this.$refs.form.reset();
      });
    },

    closeDialog2() {
      this.dialog2 = false;
    },

    async submit2() {
      this.disabled2 = true;
      if (!this.$refs.form.validate()) {
        this.disabled2 = false;
        return;
      }
      await this.deleteAll();
      this.dialog2 = false;
      this.disabled2 = false;
    },

    async submit() {
      // submitting a new student
      this.disabled = true;
      if (!this.$refs.form.validate()) {
        // every field in the form has rules bound to it (see the rules section above) - validate() goes through each field and makes sure it is valid according to the rules we set
        this.disabled = false;
        return;
      }

      let res = await APIService.post("/api/uniqueEmail", {
        email: this.newStudent.email,
      });
      if (res.status !== 200) {
        this.warnUniqueEmail = ["Email is already in use"];
        this.disabled = false;
        return;
      }

      // current done server side as well, but POST currently doesn't return the created object
      // so maybe randomize id here???
      this.newStudent.sbu_id = Math.ceil(Math.random() * 10000000) + 10000000;
      this.newStudent.password = this.newStudent.sbu_id.toString();

      res = await APIService.post("/api/student", this.newStudent);
      if (res.status === 200) {
        this.updateTable();
        this.dialog = false;
        // this.newStudent.entry =
        //   this.newStudent.entry_semester + " " + this.newStudent.entry_year;
        // this.newStudent.graduation =
        //   this.newStudent.graduation_semester +
        //   " " +
        //   this.newStudent.graduation_year;
        // this.newStudent.version =
        //   this.newStudent.requirement_version_semester +
        //   " " +
        //   this.newStudent.requirement_version_year;

        // this.students.unshift(Object.assign({}, this.newStudent));
      } else {
        // validate passed but still failed to add
        // eg. due to degree requirement not existing in database
      }
    },

    getClass(item) {
      // console.log(item);
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
</style>
<style scoped>
form {
  background: white;
  text-align: left;
  padding-left: 20px;
  padding-top: 5px;
  padding-bottom: 30px;
  border-radius: 10px;
}

label {
  color: black;
  display: inline-block;
  margin: 25px 0 15px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
}
.table-footer-prepend {
  margin-bottom: -58px;
  height: 58px;
}
input,
select {
  display: block;
  font-size: 20px;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid #ddd;
  color: #555;
}
</style>
