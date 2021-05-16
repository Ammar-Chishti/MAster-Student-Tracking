<template>
  <v-row dense>
    <v-col>
      <v-card class="elevation-5">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-container>
                <v-card class="elevation-0">
                  <v-card-title> Enrollment Trends </v-card-title>
                  <v-form ref="form" onSubmit="return false;">
                    <v-row>
                      <v-col cols="3">
                        <v-autocomplete
                          label="Start Semester"
                          :items="semesters"
                          :rules="[rules.required]"
                          v-model="startSemester"
                          :disabled="disabled"
                        ></v-autocomplete>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          label="Start Year"
                          :rules="[rules.required, rules.isYear]"
                          v-model="startYear"
                          :disabled="disabled"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="3">
                        <v-autocomplete
                          label="End Semester"
                          :items="semesters"
                          :rules="[rules.required]"
                          v-model="endSemester"
                          :disabled="disabled"
                        ></v-autocomplete>
                      </v-col>
                      <v-col cols="3">
                        <v-text-field
                          label="End Year"
                          :rules="[
                            rules.required,
                            rules.isYear,
                            rules.gradYear,
                            rules.maxRange,
                          ]"
                          v-model="endYear"
                          :disabled="disabled"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="8">
                        <v-text-field
                          :label="coursesToViewLabel"
                          :rules="[rules.required]"
                          placeholder="504, 507, 510, etc."
                          v-model="coursesToView"
                          :disabled="disabled"
                        >
                        </v-text-field>
                      </v-col>
                      <v-col cols="4">
                        <v-container fluid>
                          <v-layout align-center justify-center>
                            <v-btn
                              color="primary"
                              :disabled="disabled"
                              @click="requestCourses()"
                            >
                              Generate
                              <v-icon right>mdi-chart-areaspline</v-icon>
                            </v-btn>
                          </v-layout>
                        </v-container>
                      </v-col>
                      <!-- <v-autocomplete multiple
              label="Courses To View"
              :items="allCourses"
              v-model="coursesToView"
            ></v-autocomplete> -->
                    </v-row>
                  </v-form>
                </v-card>
              </v-container>

              <!-- <div>{{ startSemester }}</div>
              <div>{{ startYear }}</div>
              <div>{{ endSemester }}</div>
              <div>{{ endYear }}</div>
              <div>{{ coursesToView }}</div> -->
            </v-col>
            <v-col cols="12">
              <v-container>
                <div id="chartContainer">
                  <canvas id="trendsChart"></canvas>
                </div>
              </v-container>
            </v-col>
          </v-row>
        </v-container>
        <br /><br />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { Chart, registerables } from "chart.js";
import APIService from "../APIService";
Chart.register(...registerables);

export default {
  data() {
    return {
      coursesToViewLabel:
        this.$store.state.loggedInUser.department + " Courses to View (max 5):",
      semesters: ["Winter", "Spring", "SummerI", "SummerII", "Fall"],
      allCourses: [],
      startSemester: "",
      endSemester: "",
      startYear: "",
      endYear: "",
      coursesToView: "",
      disabled: false,
      rules: {
        // verification rules for adding a new student, making sure email is valid, entry year is valid, etc
        required: (v) => !!v || "Required field",
        isYear: (v) =>
          (v.length === 4 && v >= 1901 && v <= 2155) || "Enter a vaild year",
        gradYear: () =>
          this.endYear > this.startYear ||
          (this.endYear === this.startYear &&
            this.semesters.indexOf(this.endSemester) >=
              this.semesters.indexOf(this.startSemester)) ||
          "Graduation cannot be before entry",
        maxRange: () =>
          this.endYear - this.startYear <= 10 || "Maximum range of 10 years",
      },

      labels: [],
      datasets: [],
    };
  },

  mounted() {
    // const labels = [
    //   "Spring2020",
    //   "Fall2020",
    //   "Spring2021",
    //   "Fall2021",
    //   "Fall2020",
    //   "etc",
    // ];
    // const datasets = [
    //   {
    //     label: "AMS 504",
    //     backgroundColor: "rgba(255,0,0,1)",
    //     borderColor: "rgba(255,0,0,0.5)",
    //     data: [0, 22, 20, 2, 20, 30, 45],
    //   },
    //   {
    //     label: "AMS 507",
    //     backgroundColor: "rgba(0,255,0,1)",
    //     borderColor: "rgba(0,255,0,0.5)",
    //     data: [20, 20, 20, 25, 26],
    //   },
    //   {
    //     label: "AMS 508",
    //     backgroundColor: "rgba(0,0,255,1)",
    //     borderColor: "rgba(0,0,255,0.5)",
    //     data: [10, 15, 0, 0, 8, 9],
    //   },
    //   {
    //     label: "AMS 509",
    //     backgroundColor: "rgba(0,0,0,1)",
    //     borderColor: "rgba(0,0,0,0.5)",
    //     data: [20, 8, 12, 20, 33],
    //   },
    //   {
    //     label: "AMS 510",
    //     backgroundColor: "rgba(0,255,255,1)",
    //     borderColor: "rgba(0,255,255,0.5)",
    //     data: [2, 3, 4, 4, 3],
    //   },
    // ];
    // this.newChart(labels, datasets);

    // default to empty chart, example commented out above
    this.newChart([], []);
  },

  async created() {
    if (!this.$store.state.loggedInUser.isGPD) {
      this.$router.push("studenthomepage");
      return;
    }
  },

  methods: {
    async requestCourses() {
      if (!this.$refs.form.validate()) {
        return;
      }

      this.disabled = true;

      let request =
        "/api/courseplan?department=" +
        this.$store.state.loggedInUser.department;
      for (let i = parseInt(this.startYear); i <= parseInt(this.endYear); i++) {
        request += "&year=" + i.toString();
      }
      // console.log("FINAL REQUEST " + request);

      const result = await APIService.get(request);
      // console.log(result);

      // get labels of relevant semester/years
      let labels = [];
      let current =
        this.semesters.indexOf(this.startSemester) +
        5 * parseInt(this.startYear);
      let end =
        this.semesters.indexOf(this.endSemester) + 5 * parseInt(this.endYear);
      while (current <= end) {
        let semester = this.semesters[current % 5];
        let year = Math.floor(current / 5);
        labels.push(semester + " " + year);
        current += 1;
      }

      const labelsExpected = [];
      while (current <= end + 5) {
        let semester = this.semesters[current % 5];
        let year = Math.floor(current / 5);
        labelsExpected.push(semester + " " + year + " (expected)");
        current += 1;
      }

      // course numbers
      const course_nums = this.coursesToView
        .split(",")
        .map((v) => v.trim())
        .filter((v) => /^[5-9][0-9]{2}$/.test(v))
        .slice(0, 5);

      const datasets = [];
      const colors = [
        {
          backgroundColor: "rgb(255,0,0)",
          borderColor: "rgb(255,0,0)",
        },
        {
          backgroundColor: "rgb(0,255,0)",
          borderColor: "rgb(0,255,0)",
        },
        {
          backgroundColor: "rgb(0,0,255)",
          borderColor: "rgb(0,0,255)",
        },
        {
          backgroundColor: "rgb(0,0,0)",
          borderColor: "rgb(0,0,0)",
        },
        {
          backgroundColor: "rgb(0,255,255)",
          borderColor: "rgb(0,255,255)",
        },
      ];

      const department = this.$store.state.loggedInUser.department;
      for (const course_num of course_nums) {
        const nextDataSet = { label: department + " " + course_num, data: [] };
        nextDataSet.backgroundColor = colors[0].backgroundColor;
        nextDataSet.borderColor = colors[0].borderColor;
        colors.shift();

        for (const semYear of labels) {
          const search = result
            .filter((v) => parseInt(v.course_num) === parseInt(course_num))
            .filter((v) => v.semester.toString() === semYear.split(" ")[0])
            .filter((v) => v.year.toString() === semYear.split(" ")[1]);

          // console.log(search);
          nextDataSet.data.push(search.length);
        }

        const length = nextDataSet.data.length;
        const expectedDataset = [];
        for (let i = 0; i < labelsExpected.length; i++) {
          // points is an array of frequencies from the same semester
          const points = nextDataSet.data
            .map((value, index) =>
              (length - index + i) % 5 === 0 ? value : null
            )
            .filter((v) => v !== null);

          if (points.length === 0) {
            expectedDataset.push(0);
            continue;
          } else if (points.every((val, i, arr) => val === arr[0])) {
            expectedDataset.push(points[0]);
            continue;
          }

          // ordinary least squares
          const n = points.length;
          const xi = (n * (n - 1)) / 2;
          const yi = points.reduce((a, b) => a + b, 0);
          const xi2 = points
            .map((value, index) => index * index)
            .reduce((a, b) => a + b, 0);
          const xi_yi = points
            .map((value, index) => value * index)
            .reduce((a, b) => a + b, 0);

          const beta = (n * xi_yi - xi * yi) / (n * xi2 - xi * xi);
          const alpha = yi / n - beta * (xi / n);

          // console.log(n, xi, xi2, yi, xi_yi, beta, alpha, alpha + beta * n);

          expectedDataset.push(Math.ceil(alpha + beta * n));
        }

        nextDataSet.data = nextDataSet.data.concat(expectedDataset);
        datasets.push(nextDataSet);
      }
      labels = labels.concat(labelsExpected);

      // console.log(labels);
      // console.log(datasets);
      this.newChart(labels, datasets);

      this.disabled = false;
    },

    async newChart(labels, datasets) {
      const data = {
        labels: labels,
        datasets: datasets,
      };

      const config = {
        type: "line",
        data,
        options: {
          animation: false,
          plugins: {
            title: {
              display: true,
              text:
                "Trends for " +
                this.$store.state.loggedInUser.department +
                " Courses",
              font: {
                size: 14,
              },
              color: "#111",
            },
            legend: {
              position: "top",
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Semesters",
                font: {
                  weight: "bold",
                },
                color: "#111",
              },
            },
            y: {
              min: 0,
              suggestedMax: 10,
              title: {
                display: true,
                text: "Frequency",
                font: {
                  weight: "bold",
                },
                color: "#111",
              },
            },
          },
        },
      };

      // console.log(Chart.defaults);
      Chart.defaults.borderColor = "#bbb";
      Chart.defaults.color = "#111";

      // nuke the chart element and remake
      document.getElementById("chartContainer").innerHTML = "&nbsp;";
      document.getElementById("chartContainer").innerHTML =
        '<canvas id="trendsChart"></canvas>';
      new Chart(document.getElementById("trendsChart"), config);
    },
  },
};
</script>

<style scoped>
.select {
  border: 1px solid #d3d3d3;
}
</style>
