<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-card-title> Suggest Course Plan </v-card-title>
        <form ref="form" onSubmit="return false;">
          <v-container pa-6>
            <v-row>
              <v-col cols="3">
                <v-row>
                  Max # of Courses Per Semester:

                  <v-col cols="6" v-for="item in semesters" :key="item">
                    <v-text-field
                      v-model="options.maxPerSemester[item]"
                      :label="item"
                      :validate-on-blur="true"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="9">
                <br />
                <v-row>
                  <v-col cols="9">
                    <v-text-field
                      v-model="options.preferredCourses"
                      label="Preferred Courses"
                      placeholder="AMS 501, CSE 501, BMI 501, etc."
                      :disabled="options.smartSuggest"
                      :clearable="true"
                      :validate-on-blur="true"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox
                      v-model="options.preferredOrder"
                      label="Order by preference"
                      hide-details
                    ></v-checkbox>
                  </v-col>

                  <v-col cols="9">
                    <v-text-field
                      v-model="options.avoidCourses"
                      label="Avoid Courses"
                      placeholder="AMS 501, CSE 501, BMI 501, etc."
                      :disabled="options.smartSuggest"
                      :clearable="true"
                      :validate-on-blur="true"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="3">
                    <v-checkbox
                      v-model="options.smartSuggest"
                      label="Smart Suggest Mode"
                      hide-details
                    ></v-checkbox>
                  </v-col>

                  <v-col cols="3">
                    <v-autocomplete
                      v-model="options.timeRangeStart"
                      :items="times"
                      label="Time Range Start"
                      :clearable="true"
                      :validate-on-blur="true"
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="3">
                    <v-autocomplete
                      v-model="options.timeRangeEnd"
                      :items="times"
                      label="Time Range End"
                      :clearable="true"
                      :validate-on-blur="true"
                    ></v-autocomplete>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col cols="3">
                    <v-btn
                      class="success"
                      style="margin-top: 10px"
                      @click="generatePlan"
                    >
                      Generate Now
                    </v-btn>
                  </v-col>
                </v-row>
                <!-- {{ options }} -->
              </v-col>
            </v-row>
          </v-container>
        </form>
      
          <v-progress-linear
          bottom
          :active="loading"
          :indeterminate="loading"
        ></v-progress-linear>
      </v-card>
      <br />
      <!-- CURRENT COURSE PLAN data table-->
      <v-card class="elevation-5" v-show="!disabled1">
        <v-card-title>
          Suggested Course Plan 1
          <v-spacer></v-spacer>
          <v-btn
            class="success"
            style="margin-top: 10px"
            color="primary"
            @click="ChoosePlan1"
            >Choose this plan</v-btn
          >
        </v-card-title>
        <v-data-table
          :headers="ccp_table_headers"
          :items="suggestion1"
          :hide-default-footer="true"
          disable-pagination
          dense
          item-key="course_plan_id"
        >
        </v-data-table>
      </v-card>

      <!-- must-sort
          sort-by="SemesterYear" -->

      <br />
      <!-- CURRENT COURSE PLAN data table-->
      <v-card class="elevation-5" v-show="!disabled2">
        <v-card-title>
          Suggested Course Plan 2
          <v-spacer></v-spacer>
          <v-btn
            class="success"
            style="margin-top: 10px"
            color="primary"
            @click="ChoosePlan2"
            >Choose this plan</v-btn
          >
        </v-card-title>
        <v-data-table
          :headers="ccp_table_headers"
          :items="suggestion2"
          :hide-default-footer="true"
          disable-pagination
          dense
          item-key="course_plan_id"
        >
        </v-data-table>
      </v-card>

      <br />
      <!-- CURRENT COURSE PLAN data table-->
      <v-card class="elevation-5" v-show="!disabled3">
        <v-card-title>
          Suggested Course Plan 3
          <v-spacer></v-spacer>
          <v-btn
            class="success"
            style="margin-top: 10px"
            color="primary"
            @click="ChoosePlan3"
            >Choose this plan</v-btn
          >
        </v-card-title>
        <v-data-table
          :headers="ccp_table_headers"
          :items="suggestion3"
          :hide-default-footer="true"
          disable-pagination
          dense
          item-key="course_plan_id"
        >
        </v-data-table>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../APIService";
import { mapState } from "vuex";
export default {
  data() {
    return {
      options: {},
      semesters: [],
      suggestion1: [],
      suggestion2: [],
      suggestion3: [],
      disabled1: true,
      disabled2: true,
      disabled3: true,
      loading: false,

      times: [
        "07:00AM",
        "07:30AM",
        "08:00AM",
        "08:30AM",
        "09:00AM",
        "09:30AM",
        "10:00AM",
        "10:30AM",
        "11:00AM",
        "11:30AM",
        "12:00PM",
        "12:30PM",
        "01:00PM",
        "01:30PM",
        "02:00PM",
        "02:30PM",
        "03:00PM",
        "03:30PM",
        "04:00PM",
        "04:30PM",
        "05:00PM",
        "05:30PM",
        "06:00PM",
        "06:30PM",
        "07:00PM",
        "07:30PM",
        "08:00PM",
        "08:30PM",
        "09:00PM",
        "09:30PM",
        "10:00PM",
        "10:30PM",
        "11:00PM",
      ],

      ccp_table_headers: [
        { text: "Department", value: "department" },
        { text: "Course Num", value: "course_num" },
        { text: "Section", value: "section" },
        {
          text: "Semester",
          value: "SemesterYear",
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
        { text: "Timeslot", value: "timeslot" },
      ],
    };
  },
  methods: {
    async generatePlan() {
      this.loading = true;
      const result = await APIService.post(
        "/api/suggestplan/" + this.$store.state.selectedID,
        this.options
      );
      this.suggestion1 = result.data[0] || [];
      this.suggestion2 = result.data[1] || [];
      this.suggestion3 = result.data[2] || [];

      this.disabled1 = false;
      this.disabled2 = !this.suggestion2;
      this.disabled3 = !this.suggestion3;

      console.log(result);
      this.loading = false;
    },
    ChoosePlan1() {
      this.disabled1 = true;
      this.disabled2 = true;
      this.disabled3 = true;

      APIService.post("/api/addsuggested", this.suggestion1);
    },
    ChoosePlan2() {
      this.disabled1 = true;
      this.disabled2 = true;
      this.disabled3 = true;
      APIService.post("/api/addsuggested", this.suggestion2);
    },
    ChoosePlan3() {
      this.disabled1 = true;
      this.disabled2 = true;
      this.disabled3 = true;
      APIService.post("/api/addsuggested", this.suggestion3);
    },

    async getSemesters(
      entrySemester,
      entryYear,
      graduationSemester,
      graduationYear
    ) {
      const semesters = ["Winter", "Spring", "SummerI", "SummerII", "Fall"];
      let labels = [];

      let current = semesters.indexOf(entrySemester) + 5 * parseInt(entryYear);
      let end =
        semesters.indexOf(graduationSemester) + 5 * parseInt(graduationYear) + 1;
      while (current <= end) {
        let semester = semesters[current % 5];
        let year = Math.floor(current / 5);
        labels.push(semester + " " + year);
        current += 1;
      }
      return labels;
    },
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
      "/api/student/" + this.$store.state.selectedID + "?associate=true"
    );

    // console.log(s);

    this.semesters = await this.getSemesters(
      s.entry_semester,
      s.entry_year,
      s.graduation_semester,
      s.graduation_year
    );
    // this.options.maxPerSemesters = 0;

    let newObjSemesters = {};
    for (let s of this.semesters) {
      newObjSemesters[s] = 5;
    }

    this.options.maxPerSemester = newObjSemesters;
    this.options.timeRangeStart = "07:00AM";
    this.options.timeRangeEnd = "11:00PM";
    this.options.preferredCourses = "";
    this.options.avoidCourses = "";
    this.options.extendSemesterName = this.semesters[this.semesters.length -1];

    // console.log(newObjSemesters);
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
