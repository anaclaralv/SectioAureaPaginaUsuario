<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class CronometroController {
    private $cronometro;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->cronometro = new Cronometro($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->cronometro->read($id_usuario);
        
        $cronometros = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($cronometros, $row);
        }
        
        echo json_encode($cronometros);
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->tempo_cronometro)) {
            http_response_code(400);
            echo json_encode(["message" => "Tempo do cronômetro é obrigatório"]);
            return;
        }
        
        $this->cronometro->id_usuario = $id_usuario;
        $this->cronometro->tempo_cronometro = $data->tempo_cronometro;
        $this->cronometro->descricao = $data->descricao ?? null;
        
        if($this->cronometro->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Cronômetro registrado com sucesso",
                "id_cron" => $this->cronometro->id_cron
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao registrar cronômetro. Verifique se o usuário existe."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->cronometro->id_cron = $id;
        $this->cronometro->id_usuario = $id_usuario;
        $this->cronometro->tempo_cronometro = $data->tempo_cronometro ?? null;
        $this->cronometro->descricao = $data->descricao ?? null;
        
        if($this->cronometro->update()) {
            echo json_encode(["message" => "Cronômetro atualizado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar cronômetro"]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->cronometro->id_cron = $id;
        $this->cronometro->id_usuario = $id_usuario;
        
        if($this->cronometro->delete()) {
            echo json_encode(["message" => "Cronômetro deletado com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar cronômetro"]);
        }
    }
}
?>